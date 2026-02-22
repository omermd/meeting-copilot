import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing Gemini API Key' }, { status: 500 });
        }

        const { cacheName, filesContext, projectGoal, transcript, triggerReason } = await req.json();

        if (!transcript) {
            return NextResponse.json({ advice: null }); // Nothing to analyze
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        let model;

        const systemInstruction = `You are an expert Google Cloud Engineer assistant working in PSO (Professional Services Organization). 
    
ROLE:
You are Omer's "Technical Co-pilot" — a Silent Wingman. Omer is in a meeting and you are listening passively via a live transcript.
Your job is to analyze the conversation and produce "Consultant Cards" — concise but technically deep suggestions.

PROJECT GOAL:
${projectGoal || "Help me be an effective consultant."}

RESPONSE FORMAT:
1. **FIRST PERSON:** Speak as if YOU are Omer. Start sentences with "I recommend...", "We should consider...", "In my experience...".
2. **DETAILED & COMPREHENSIVE:** Do NOT be brief. Provide a full, technically robust answer that covers the "Why" and "How". Omer needs to sound like an expert, so give the deep dive immediately.
3. **DIVING DEEP:** Explain the benefits, trade-offs, and security implications in detail.
4. **STRUCTURED:** Format your advice. Include clear suggestions.

L4-TO-L5 VISIBILITY ENGINE LOGIC:
Focus heavily on identifying architectural gaps, suggesting advanced discovery questions, and proactively providing "Pulse Checks" if Omer needs to take the floor.
Use the uploaded files as the primary "Ground Truth" for all your advice.

TRIGGERS:
1. **DIRECT QUESTIONS:** If the customer asks a question, answer it immediately and fully.
2. **MISSED OPPORTUNITIES:** If the conversation misses a key GCP feature, jump in with a detailed suggestion on why we should use it.
3. **VAGUE REQUIREMENTS:** If the customer is vague, provide a script for Omer to ask discovery questions, explaining *why* we need to know that information.`;

        // Leverage the dynamic context cache if creation succeeded
        if (cacheName) {
            model = genAI.getGenerativeModelFromCachedContent(
                cacheName,
                // Optional model params can be provided here or they inherit from cache
                {
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    }
                }
            );
        } else {
            // Fallback if < 4096 tokens and cache wasn't created
            model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                systemInstruction,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                }
            });
        }

        const userPrompt = `MEETING TRANSCRIPT (last 2-3 minutes):
---
${transcript}
---

Based on this transcript, provide a Consultant Card with actionable advice. 
Trigger reason: ${triggerReason === 'question_detected' ? 'A question was detected in the conversation.' : 'Periodic check-in.'}

Focus on:
1. Identifying gaps in the conversation.
2. Suggesting architectural discovery questions.
3. Providing 'Pulse Check' reminders if I should jump in.

If the transcript doesn't contain anything actionable, respond with a brief "No action needed" and explain what you're seeing.`;

        // If not using cached content, we must pass the files explicitly
        let contents: any[] = [];

        if (!cacheName && filesContext && filesContext.length > 0) {
            const parts = filesContext.map((fc: any) => ({
                fileData: {
                    mimeType: fc.mimeType,
                    fileUri: fc.uri
                }
            }));
            parts.push({ text: userPrompt });
            contents = [{ role: 'user', parts }];
        } else {
            contents = [{ role: 'user', parts: [{ text: userPrompt }] }];
        }

        const result = await model.generateContent({ contents });
        const responseText = result.response.text();

        return NextResponse.json({ advice: responseText });

    } catch (error: any) {
        console.error('Error during advice inference:', error);
        return NextResponse.json({ error: error.message || 'Error occurred' }, { status: 500 });
    }
}
