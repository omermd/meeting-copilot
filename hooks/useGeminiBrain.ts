import { useRef, useCallback, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ConsultantCard, TriggerReason, ContextFile } from '../types';

interface UseGeminiBrainProps {
    apiKey: string;
    systemInstruction: string | { parts: any[] };
    contextFiles: ContextFile[];
}

interface UseGeminiBrainReturn {
    cards: ConsultantCard[];
    isThinking: boolean;
    streamingText: string;
    /** Send a transcript buffer snapshot to Gemini and get a Consultant Card back */
    generateCard: (transcriptBuffer: string, triggerReason: TriggerReason) => Promise<void>;
    clearCards: () => void;
}

export const useGeminiBrain = ({
    apiKey,
    systemInstruction,
    contextFiles,
}: UseGeminiBrainProps): UseGeminiBrainReturn => {
    const [cards, setCards] = useState<ConsultantCard[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [streamingText, setStreamingText] = useState('');

    const aiClientRef = useRef<GoogleGenAI | null>(null);
    const isGeneratingRef = useRef(false);

    const getClient = useCallback(() => {
        if (!aiClientRef.current && apiKey) {
            aiClientRef.current = new GoogleGenAI({ apiKey });
        }
        return aiClientRef.current;
    }, [apiKey]);

    const generateCard = useCallback(
        async (transcriptBuffer: string, triggerReason: TriggerReason) => {
            if (isGeneratingRef.current) {
                console.log('[GeminiBrain] Already generating, skipping...');
                return;
            }

            const client = getClient();
            if (!client || !transcriptBuffer.trim()) return;

            isGeneratingRef.current = true;
            setIsThinking(true);
            setStreamingText('');

            try {
                // Build the system prompt
                let systemText = '';
                if (typeof systemInstruction === 'string') {
                    systemText = systemInstruction;
                } else if (systemInstruction?.parts) {
                    systemText = systemInstruction.parts
                        .filter((p: any) => p.text)
                        .map((p: any) => p.text)
                        .join('\n');
                }

                // Build context from files
                let fileContext = '';
                if (contextFiles.length > 0) {
                    fileContext = '\n\nCONTEXT FILES:\n';
                    contextFiles.forEach(f => {
                        if (!f.isBinary && f.data) {
                            fileContext += `\n--- START FILE: ${f.name} ---\n${f.data}\n--- END FILE ---\n`;
                        }
                    });
                }

                // Build the user message — the transcript buffer
                const userPrompt = `MEETING TRANSCRIPT (last 2-3 minutes):
---
${transcriptBuffer}
---

Based on this transcript, provide a Consultant Card with actionable advice. 
Trigger reason: ${triggerReason === 'question_detected' ? 'A question was detected in the conversation.' : 'Periodic check-in.'}

Focus on:
1. Any direct questions that need expert answers
2. Missed opportunities to mention relevant GCP features
3. Technical clarifications or corrections needed
4. Suggested talking points or discovery questions

If the transcript doesn't contain anything actionable, respond with a brief "No action needed" and explain what you're seeing.`;

                // Build parts for the request
                const contents: any[] = [
                    {
                        role: 'user',
                        parts: [{ text: userPrompt }],
                    },
                ];

                // Add binary files as inline data — ONLY PDFs are supported by Gemini
                // DOCX and other binary formats will cause a 400 error
                const SUPPORTED_BINARY_MIMES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'];
                const inlineDataParts: any[] = [];
                contextFiles.forEach(f => {
                    if (f.isBinary && f.data) {
                        if (SUPPORTED_BINARY_MIMES.includes(f.mimeType)) {
                            inlineDataParts.push({
                                inlineData: {
                                    mimeType: f.mimeType,
                                    data: f.data,
                                },
                            });
                        } else {
                            console.warn(`[GeminiBrain] Skipping unsupported binary file: ${f.name} (${f.mimeType}). Convert to PDF or text.`);
                        }
                    }
                });

                if (inlineDataParts.length > 0) {
                    contents[0].parts.push(...inlineDataParts);
                }

                // Use streaming for real-time feedback
                const response = await client.models.generateContentStream({
                    model: 'gemini-2.0-flash',
                    contents,
                    config: {
                        systemInstruction: systemText + fileContext,
                        maxOutputTokens: 1024,
                        temperature: 0.7,
                    },
                });

                let fullText = '';
                for await (const chunk of response) {
                    const chunkText = chunk.text || '';
                    fullText += chunkText;
                    setStreamingText(fullText);
                }

                // Create the Consultant Card
                if (fullText.trim()) {
                    const card: ConsultantCard = {
                        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                        text: fullText,
                        timestamp: new Date(),
                        triggerReason,
                        contextSnapshot: transcriptBuffer.substring(0, 200) + '...',
                    };

                    setCards(prev => [...prev, card]);
                }

                setStreamingText('');
            } catch (error) {
                console.error('[GeminiBrain] Error generating card:', error);
                setStreamingText('');
            } finally {
                isGeneratingRef.current = false;
                setIsThinking(false);
            }
        },
        [getClient, systemInstruction, contextFiles]
    );

    const clearCards = useCallback(() => {
        setCards([]);
        setStreamingText('');
    }, []);

    return {
        cards,
        isThinking,
        streamingText,
        generateCard,
        clearCards,
    };
};
