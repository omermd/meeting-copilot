import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage } from '@google/genai';
import { createPcmBlob, AUDIO_INPUT_SAMPLE_RATE } from '../utils/audio-utils';
import { Message, ConnectionStatus } from '../types';

interface UseLiveSessionProps {
  apiKey: string;
  systemInstruction: string | { parts: any[] };
}

export const useLiveSession = ({ apiKey, systemInstruction }: UseLiveSessionProps) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);

  const [streamingUserText, setStreamingUserText] = useState('');
  const [streamingModelText, setStreamingModelText] = useState('');

  const [isMuted, setIsMuted] = useState(false);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentInputTranscriptionRef = useRef('');
  const inputTranscriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationHistoryRef = useRef<Message[]>([]);
  const aiClientRef = useRef<any>(null);
  const isGeneratingRef = useRef(false);

  const connect = useCallback(async () => {
    if (!apiKey) return;

    // FRESH START: Clear messages on connect
    setMessages([]);
    setStreamingUserText('');
    setStreamingModelText('');
    conversationHistoryRef.current = [];

    setStatus('connecting');

    try {
      const ai = new GoogleGenAI({ apiKey });
      aiClientRef.current = ai;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: AUDIO_INPUT_SAMPLE_RATE });

      await inputAudioContextRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened (Transcription Only)');
            setStatus('connected');

            if (!inputAudioContextRef.current) return;

            mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
            scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

            scriptProcessorRef.current.onaudioprocess = (e) => {
              if (!inputAudioContextRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const { serverContent } = message;
            if (!serverContent) return;

            // Handle Input Transcription (User) - CONTINUOUS
            if (serverContent.inputTranscription) {
              currentInputTranscriptionRef.current += serverContent.inputTranscription.text;
              setStreamingUserText(currentInputTranscriptionRef.current);

              // Clear previous timeout
              if (inputTranscriptionTimeoutRef.current) {
                clearTimeout(inputTranscriptionTimeoutRef.current);
              }

              // Set new timeout to commit text after silence (2s)
              inputTranscriptionTimeoutRef.current = setTimeout(async () => {
                if (currentInputTranscriptionRef.current.trim()) {
                  const text = currentInputTranscriptionRef.current;
                  const userMessage: Message = {
                    id: Date.now().toString() + '-user',
                    role: 'user',
                    text: text,
                    timestamp: new Date()
                  };

                  setMessages(prev => [...prev, userMessage]);
                  conversationHistoryRef.current.push(userMessage);
                  currentInputTranscriptionRef.current = '';
                  setStreamingUserText('');

                  // Generate AI response using standard API (complete response, not streaming)
                  if (!isGeneratingRef.current && aiClientRef.current) {
                    isGeneratingRef.current = true;
                    setStreamingModelText('Generating response...');

                    try {
                      // Build conversation history for context
                      const contents = conversationHistoryRef.current.map(msg => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.text }]
                      }));

                      const model = aiClientRef.current.getGenerativeModel({
                        model: 'gemini-2.0-flash-exp',
                        systemInstruction: systemInstruction
                      });

                      const result = await model.generateContent({ contents });
                      const responseText = result.response.text();

                      const modelMessage: Message = {
                        id: Date.now().toString() + '-model',
                        role: 'model',
                        text: responseText,
                        timestamp: new Date()
                      };

                      setMessages(prev => [...prev, modelMessage]);
                      conversationHistoryRef.current.push(modelMessage);
                      setStreamingModelText('');
                    } catch (error) {
                      console.error('Error generating AI response:', error);
                      setStreamingModelText('');
                    } finally {
                      isGeneratingRef.current = false;
                    }
                  }
                }
              }, 2000);
            }
          },
          onclose: (e) => {
            console.log('Gemini Live Session Closed', e);
            setStatus('disconnected');

            if (inputTranscriptionTimeoutRef.current) {
              clearTimeout(inputTranscriptionTimeoutRef.current);
            }

            setStreamingUserText('');
            setStreamingModelText('');
            currentInputTranscriptionRef.current = '';
            conversationHistoryRef.current = [];
            isGeneratingRef.current = false;
          },
          onerror: (err) => {
            console.error('Gemini Live Session Error', err);
            setStatus('error');
            setStreamingUserText('');
            setStreamingModelText('');
          }
        },
        config: {
          // NO audio output - transcription only
          inputAudioTranscription: {},
          systemInstruction: systemInstruction as any,
        }
      });

      sessionRef.current = sessionPromise;

    } catch (error) {
      console.error('Connection failed:', error);
      setStatus('error');
    }
  }, [apiKey, systemInstruction]);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => {
        if (session.close) session.close();
      });
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    if (inputTranscriptionTimeoutRef.current) {
      clearTimeout(inputTranscriptionTimeoutRef.current);
    }

    scriptProcessorRef.current = null;
    setStatus('disconnected');

    setMessages([]);
    currentInputTranscriptionRef.current = '';
    setStreamingUserText('');
    setStreamingModelText('');
    conversationHistoryRef.current = [];
    isGeneratingRef.current = false;
  }, []);

  const toggleMute = () => {
    // Mute functionality for future audio output if needed
    setIsMuted(!isMuted);
  };

  return {
    status,
    messages,
    streamingUserText,
    streamingModelText,
    connect,
    disconnect,
    isMuted,
    toggleMute
  };
};