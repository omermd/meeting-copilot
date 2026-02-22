import { useRef, useCallback, useState } from 'react';
import { ConsultantCard, TriggerReason } from '../types';

interface UseGeminiBrainProps {
    sessionConfig: { cacheName?: string, filesContext?: any[], projectGoal?: string } | null;
}

interface UseGeminiBrainReturn {
    cards: ConsultantCard[];
    isThinking: boolean;
    generateCard: (transcriptBuffer: string, triggerReason: TriggerReason) => Promise<void>;
    clearCards: () => void;
}

export const useGeminiBrain = ({
    sessionConfig,
}: UseGeminiBrainProps): UseGeminiBrainReturn => {
    const [cards, setCards] = useState<ConsultantCard[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const isGeneratingRef = useRef(false);

    const generateCard = useCallback(
        async (transcriptBuffer: string, triggerReason: TriggerReason) => {
            if (isGeneratingRef.current || !sessionConfig || !transcriptBuffer.trim()) {
                return;
            }

            isGeneratingRef.current = true;
            setIsThinking(true);

            try {
                const response = await fetch('/api/advice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cacheName: sessionConfig.cacheName,
                        filesContext: sessionConfig.filesContext,
                        projectGoal: sessionConfig.projectGoal,
                        transcript: transcriptBuffer,
                        triggerReason
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch advice');
                }

                if (data.advice && data.advice.trim()) {
                    // Check if the advice says no action needed
                    if (!data.advice.toLowerCase().includes("no action needed")) {
                        const card: ConsultantCard = {
                            id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                            text: data.advice,
                            timestamp: new Date(),
                            triggerReason,
                            contextSnapshot: transcriptBuffer.substring(0, 200) + '...',
                        };

                        setCards(prev => [...prev, card]);
                    }
                }
            } catch (error) {
                console.error('[GeminiBrain] Error generating card via API:', error);
            } finally {
                isGeneratingRef.current = false;
                setIsThinking(false);
            }
        },
        [sessionConfig]
    );

    const clearCards = useCallback(() => {
        setCards([]);
    }, []);

    return {
        cards,
        isThinking,
        generateCard,
        clearCards,
    };
};
