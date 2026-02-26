import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing Gemini API Key' }, { status: 500 });
        }

        const { formattedTranscript, filesContext, projectGoal } = await req.json();

        if (!formattedTranscript) {
            return NextResponse.json({ notes: 'No transcript data available to summarize.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const systemInstruction = `You are a Technical Program Manager. Generate a clean Markdown summary. 
Include: 
- Executive Summary
- Decisions
- Action Items (with Owners)
- Technical Risks/Blockers.

Crucial: If context files (SOW/TDD) were uploaded, cross-reference them (e.g., 'Does this Action Item align with the SOW deliverables?'). Use the provided Project Goal to guide the focus of your notes.`;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction,
            generationConfig: {
                temperature: 0.2, // Lower temperature for more analytical/factual notes
                maxOutputTokens: 2048,
            }
        });

        const userPrompt = `MEETING TRANSCRIPT:
---
${formattedTranscript}
---

PROJECT GOAL: ${projectGoal || 'None provided.'}

Based on this transcript and context files, generate the meeting artifacts in Markdown format.`;

        let contents: any[] = [];

        if (filesContext && filesContext.length > 0) {
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

        return NextResponse.json({ notes: responseText });

    } catch (error: any) {
        console.error('Error generating meeting notes:', error);

        let errorMessage = error.message || 'Error occurred while generating notes';

        if (errorMessage.includes('429') || errorMessage.includes('Resource exhausted')) {
            errorMessage = "Gemini API Rate Limit Exceeded: You've hit the free tier limits (either requests per minute, tokens per minute, or daily quota). Since the live assistant polls the API every 30 seconds during the meeting, a 30-minute meeting consumes a lot of quota. Please try again later or upgrade your Google Cloud project to a paid tier.";
        }

        return NextResponse.json({ error: errorMessage }, { status: error.status || 500 });
    }
}
