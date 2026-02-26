import { useCallback, useRef, useEffect } from 'react';
import { useDeepgramTranscription } from './useDeepgramTranscription';
import { useGeminiBrain } from './useGeminiBrain';
import { useShadowTrigger } from './useShadowTrigger';
import {
    ConnectionStatus,
    ConsultantCard,
    TranscriptSegment,
    TriggerReason,
    ShadowTriggerConfig,
} from '../types';

const CONTEXT_BUFFER_MAX_CHARS = 3000;

interface UseSilentObserverProps {
    deepgramApiKey: string;
    sessionConfig: { cacheName?: string, filesContext?: any[], projectGoal?: string } | null;
    triggerConfig?: Partial<ShadowTriggerConfig>;
}

interface UseSilentObserverReturn {
    status: ConnectionStatus;
    segments: TranscriptSegment[];
    interimText: string;
    fullTranscript: string;
    formattedTranscript: string;
    cards: ConsultantCard[];
    isThinking: boolean;
    secondsUntilNext: number;
    isOnCooldown: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    manualTrigger: () => void;
}

export const useSilentObserver = ({
    deepgramApiKey,
    sessionConfig,
    triggerConfig,
}: UseSilentObserverProps): UseSilentObserverReturn => {
    const {
        status,
        segments,
        interimText,
        fullTranscript,
        formattedTranscript,
        connect: dgConnect,
        disconnect: dgDisconnect,
        clearTranscript,
    } = useDeepgramTranscription({
        apiKey: deepgramApiKey,
        language: 'en-US',
        diarize: true,
        model: 'nova-3',
    });

    const {
        cards,
        isThinking,
        generateCard,
        clearCards,
    } = useGeminiBrain({
        sessionConfig,
    });

    const getTranscriptBuffer = useCallback(() => {
        // Use formatted transcript to keep speaker labels for the AI Coach
        const buffer = formattedTranscript + (interimText ? '\n[Interim]: ' + interimText : '');

        // Sliding window: only keep the last ~300 words
        const words = buffer.split(/\s+/);
        if (words.length > 300) {
            return words.slice(-300).join(' ');
        }
        return buffer;
    }, [formattedTranscript, interimText]);

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

    const lastSegmentCountRef = useRef(0);

    useEffect(() => {
        if (segments.length > lastSegmentCountRef.current) {
            const newSegments = segments.slice(lastSegmentCountRef.current);
            newSegments.forEach(seg => feedText(seg.text));
            lastSegmentCountRef.current = segments.length;
        }
    }, [segments, feedText]);

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
        formattedTranscript,
        cards,
        isThinking,
        secondsUntilNext,
        isOnCooldown,
        connect,
        disconnect,
        manualTrigger,
    };
};
