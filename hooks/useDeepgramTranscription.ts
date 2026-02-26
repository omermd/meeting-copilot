import { useState, useRef, useCallback, useEffect } from 'react';
import { ConnectionStatus, TranscriptSegment } from '../types';

const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen';

interface UseDeepgramTranscriptionProps {
    apiKey: string;
    /** Language code, e.g. 'en-US' */
    language?: string;
    /** Whether to enable speaker diarization */
    diarize?: boolean;
    /** Model to use (e.g. 'nova-2') */
    model?: string;
}

interface UseDeepgramTranscriptionReturn {
    status: ConnectionStatus;
    /** All finalized transcript segments */
    segments: TranscriptSegment[];
    /** Currently in-progress (interim) text being spoken */
    interimText: string;
    /** Full combined transcript of all finalized segments */
    fullTranscript: string;
    /** Full transcript with timestamps and speaker labels */
    formattedTranscript: string;
    connect: () => Promise<void>;
    disconnect: () => void;
    /** Clear transcript history */
    clearTranscript: () => void;
}

export const useDeepgramTranscription = ({
    apiKey,
    language = 'en-US',
    diarize = true,
    model = 'nova-3',
}: UseDeepgramTranscriptionProps): UseDeepgramTranscriptionReturn => {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [segments, setSegments] = useState<TranscriptSegment[]>([]);
    const [interimText, setInterimText] = useState('');

    const wsRef = useRef<WebSocket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const keepAliveRef = useRef<NodeJS.Timeout | null>(null);

    // Build the full transcript from segments
    const fullTranscript = segments.map(s => s.text).join(' ');

    // Build formatted transcript with timestamps
    const formattedTranscript = segments.map(s => {
        const time = s.timestamp.toLocaleTimeString('en-US', { hour12: false });
        const speakerStr = s.speaker ? `${s.speaker}: ` : '';
        return `[${time}] ${speakerStr}${s.text}`;
    }).join('\n');

    const clearTranscript = useCallback(() => {
        setSegments([]);
        setInterimText('');
    }, []);

    const disconnect = useCallback(() => {
        // Close WebSocket
        if (wsRef.current) {
            try {
                // Send close frame properly
                if (wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: 'CloseStream' }));
                }
                wsRef.current.close();
            } catch (e) {
                // Ignore errors on close
            }
            wsRef.current = null;
        }

        // Stop media stream tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }

        // Clean up processor
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        // Clear keep-alive interval
        if (keepAliveRef.current) {
            clearInterval(keepAliveRef.current);
            keepAliveRef.current = null;
        }

        setStatus('disconnected');
    }, []);

    const connect = useCallback(async () => {
        if (!apiKey) {
            console.error('[Deepgram] No API key provided');
            setStatus('error');
            return;
        }

        setStatus('connecting');

        try {
            // 1. Get microphone access
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            // 1b. Get system/meeting audio via screen share
            let displayStream: MediaStream | null = null;
            try {
                displayStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { displaySurface: 'browser' } as any, // Request tab by default
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000,
                        echoCancellation: true,
                        noiseSuppression: true,
                    } as any,
                });
            } catch (e) {
                console.warn('[Deepgram] Screen capture for audio failed or was cancelled by user:', e);
            }

            const allTracks = [...micStream.getTracks()];
            if (displayStream) {
                allTracks.push(...displayStream.getTracks());
            }
            streamRef.current = new MediaStream(allTracks);

            // 2. Build Deepgram WebSocket URL with query params
            const params = new URLSearchParams({
                model,
                language,
                punctuate: 'true',
                interim_results: 'true',
                smart_format: 'true',
                filler_words: 'false',
                diarize: String(diarize),
                encoding: 'linear16',
                sample_rate: '16000',
                channels: '1',
            });

            const wsUrl = `${DEEPGRAM_WS_URL}?${params.toString()}`;

            // 3. Open WebSocket
            const ws = new WebSocket(wsUrl, ['token', apiKey]);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[Deepgram] WebSocket connected');
                setStatus('connected');

                // Start keep-alive pings every 10 seconds
                keepAliveRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'KeepAlive' }));
                    }
                }, 10000);

                // 4. Set up audio capture and streaming
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioContext = new AudioContextClass({ sampleRate: 16000 });
                audioContextRef.current = audioContext;

                // Mix microphone and system audio using a GainNode
                const mixNode = audioContext.createGain();

                const micSource = audioContext.createMediaStreamSource(micStream);
                micSource.connect(mixNode);

                if (displayStream && displayStream.getAudioTracks().length > 0) {
                    const displaySource = audioContext.createMediaStreamSource(displayStream);
                    displaySource.connect(mixNode);
                }

                const processor = audioContext.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;

                processor.onaudioprocess = (e: AudioProcessingEvent) => {
                    if (ws.readyState !== WebSocket.OPEN) return;

                    const inputData = e.inputBuffer.getChannelData(0);
                    // Convert Float32 -> Int16 PCM
                    const int16 = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        int16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
                    }
                    ws.send(int16.buffer);
                };

                mixNode.connect(processor);
                processor.connect(audioContext.destination);
            };

            ws.onmessage = (event: MessageEvent) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'Results' && data.channel?.alternatives?.[0]) {
                        const alt = data.channel.alternatives[0];
                        const transcript = alt.transcript || '';

                        if (!transcript.trim()) return;

                        if (data.is_final) {
                            // Final segment — add to history
                            const segment: TranscriptSegment = {
                                id: `dg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                                text: transcript,
                                timestamp: new Date(),
                                isFinal: true,
                                speaker: alt.words?.[0]?.speaker !== undefined
                                    ? `Speaker ${alt.words[0].speaker}`
                                    : undefined,
                            };
                            setSegments(prev => [...prev, segment]);
                            setInterimText('');
                        } else {
                            // Interim result — show as streaming text
                            setInterimText(transcript);
                        }
                    }
                } catch (e) {
                    console.warn('[Deepgram] Failed to parse message:', e);
                }
            };

            ws.onerror = (e) => {
                console.error('[Deepgram] WebSocket error:', e);
                setStatus('error');
            };

            ws.onclose = (e) => {
                console.log('[Deepgram] WebSocket closed:', e.code, e.reason);
                setStatus('disconnected');

                // Clean up keep-alive
                if (keepAliveRef.current) {
                    clearInterval(keepAliveRef.current);
                    keepAliveRef.current = null;
                }
            };
        } catch (error) {
            console.error('[Deepgram] Failed to connect:', error);
            setStatus('error');
        }
    }, [apiKey, language, diarize, model]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        status,
        segments,
        interimText,
        fullTranscript,
        formattedTranscript,
        connect,
        disconnect,
        clearTranscript,
    };
};
