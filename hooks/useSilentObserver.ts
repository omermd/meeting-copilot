import { useCallback, useRef, useEffect } from 'react';
import { useDeepgramTranscription } from './useDeepgramTranscription';
import { useGeminiBrain } from './useGeminiBrain';
import { useShadowTrigger } from './useShadowTrigger';
import {
    ConnectionStatus,
    ContextFile,
    ConsultantCard,
    TranscriptSegment,
    TriggerReason,
    ShadowTriggerConfig,
} from '../types';

// ─── Context Buffer Configuration ──────────────────────────────────────────────
/** Keep the last N characters of transcript as context window (~2-3 minutes of speech) */
const CONTEXT_BUFFER_MAX_CHARS = 3000;

interface UseSilentObserverProps {
    deepgramApiKey: string;
    geminiApiKey: string;
    systemInstruction: string | { parts: any[] };
    contextFiles: ContextFile[];
    triggerConfig?: Partial<ShadowTriggerConfig>;
}

interface UseSilentObserverReturn {
    /** Connection status of the Deepgram transcription */
    status: ConnectionStatus;
    /** Finalized transcript segments */
    segments: TranscriptSegment[];
    /** Currently streaming interim text */
    interimText: string;
    /** Full transcript text */
    fullTranscript: string;
    /** AI-generated Consultant Cards */
    cards: ConsultantCard[];
    /** Whether Gemini is currently thinking */
    isThinking: boolean;
    /** Streaming text from Gemini */
    streamingModelText: string;
    /** Seconds until next auto-trigger */
    secondsUntilNext: number;
    /** Whether trigger is on cooldown */
    isOnCooldown: boolean;
    /** Connect and start listening */
    connect: () => Promise<void>;
    /** Disconnect and stop */
    disconnect: () => void;
    /** Manually trigger a Gemini analysis */
    manualTrigger: () => void;
}

export const useSilentObserver = ({
    deepgramApiKey,
    geminiApiKey,
    systemInstruction,
    contextFiles,
    triggerConfig,
}: UseSilentObserverProps): UseSilentObserverReturn => {
    // ─── Layer 1: Continuous Listener (Deepgram) ──────────────────────────────
    const {
        status,
        segments,
        interimText,
        fullTranscript,
        connect: dgConnect,
        disconnect: dgDisconnect,
        clearTranscript,
    } = useDeepgramTranscription({
        apiKey: deepgramApiKey,
        language: 'en-US',
        diarize: true,
        model: 'nova-3',
    });

    // ─── Layer 2: On-Demand Brain (Gemini) ────────────────────────────────────
    const {
        cards,
        isThinking,
        streamingText: streamingModelText,
        generateCard,
        clearCards,
    } = useGeminiBrain({
        apiKey: geminiApiKey,
        systemInstruction,
        contextFiles,
    });

    // ─── Context Buffer ──────────────────────────────────────────────────────
    // Returns the last ~2-3 minutes of transcript as a sliding window
    const getTranscriptBuffer = useCallback(() => {
        const buffer = fullTranscript + (interimText ? ' ' + interimText : '');
        if (buffer.length > CONTEXT_BUFFER_MAX_CHARS) {
            return buffer.slice(-CONTEXT_BUFFER_MAX_CHARS);
        }
        return buffer;
    }, [fullTranscript, interimText]);

    // ─── Layer 3: Shadow Trigger ──────────────────────────────────────────────
    const handleTrigger = useCallback(
        (buffer: string, reason: TriggerReason) => {
            generateCard(buffer, reason);
        },
        [generateCard]
    );

    const {
        manualTrigger,
        isOnCooldown,
        secondsUntilNext,
        feedText,
    } = useShadowTrigger({
        getTranscriptBuffer,
        onTrigger: handleTrigger,
        isActive: status === 'connected',
        config: triggerConfig,
    });

    // ─── Feed new segments into the Shadow Trigger for question detection ─────
    const lastSegmentCountRef = useRef(0);

    useEffect(() => {
        if (segments.length > lastSegmentCountRef.current) {
            const newSegments = segments.slice(lastSegmentCountRef.current);
            newSegments.forEach(seg => feedText(seg.text));
            lastSegmentCountRef.current = segments.length;
        }
    }, [segments, feedText]);

    // ─── Orchestrated Connect / Disconnect ────────────────────────────────────
    const connect = useCallback(async () => {
        clearTranscript();
        clearCards();
        lastSegmentCountRef.current = 0;
        await dgConnect();
    }, [dgConnect, clearTranscript, clearCards]);

    const disconnect = useCallback(() => {
        dgDisconnect();
    }, [dgDisconnect]);

    return {
        status,
        segments,
        interimText,
        fullTranscript,
        cards,
        isThinking,
        streamingModelText,
        secondsUntilNext,
        isOnCooldown,
        connect,
        disconnect,
        manualTrigger,
    };
};
