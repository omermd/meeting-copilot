import { NextRequest, NextResponse } from 'next/server';
import { GoogleAIFileManager, GoogleAICacheManager } from '@google/generative-ai/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing Gemini API Key' }, { status: 500 });
        }

        const formData = await req.formData();
        const projectGoal = formData.get('projectGoal') as string;

        if (!projectGoal) {
            return NextResponse.json({ error: 'Missing Project Goal' }, { status: 400 });
        }

        const fileManager = new GoogleAIFileManager(apiKey);
        const cacheManager = new GoogleAICacheManager(apiKey);

        const uploadedFiles: { file: { uri: string, mimeType: string } }[] = [];

        // Process all files in formData
        for (const [key, value] of formData.entries()) {
            if (key === 'files' && value instanceof File) {
                const file = value;
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Write to tmp dir
                const tmpPath = path.join(os.tmpdir(), file.name);
                await fs.writeFile(tmpPath, buffer);

                console.log(`Uploading ${file.name} to Gemini...`);
                const uploadResult = await fileManager.uploadFile(tmpPath, {
                    mimeType: file.type || 'text/plain',
                    displayName: file.name,
                });

                uploadedFiles.push(uploadResult as any);

                // Cleanup tmp file
                await fs.unlink(tmpPath);
            }
        }

        const systemInstruction = `You are an expert Google Cloud Engineer assistant working in PSO (Professional Services Organization). 
    
ROLE:
You are Omer's "Technical Co-pilot" — a Silent Wingman. Omer is in a meeting and you are listening passively via a live transcript.
Your job is to analyze the conversation and produce "Consultant Cards" — concise but technically deep suggestions.

PROJECT GOAL:
${projectGoal}

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

        let cacheName: string | undefined;

        try {
            // Initialize the dynamic context cache
            // Note: Gemini 1.5 Flash supports Cached Content
            const cacheResult = await cacheManager.create({
                model: 'models/gemini-2.0-flash',
                displayName: 'copilot-dynamic-session',
                systemInstruction,
                contents: [
                    {
                        role: 'user',
                        parts: uploadedFiles.map(uf => ({
                            fileData: {
                                mimeType: uf.file.mimeType,
                                fileUri: uf.file.uri
                            }
                        }))
                    }
                ],
                ttlSeconds: 7200, // 2 hours
            });

            console.log(`Cache created with name: ${cacheResult.name}`);
            cacheName = cacheResult.name;
        } catch (cacheError: any) {
            console.warn('Cache creation failed (possibly due to < 4096 tokens). Falling back to inline file passing.', cacheError.message);
        }

        return NextResponse.json({
            cacheName,
            filesContext: uploadedFiles.map(uf => ({ uri: uf.file.uri, mimeType: uf.file.mimeType }))
        });

    } catch (error: any) {
        console.error('Error during setup:', error);
        return NextResponse.json({ error: error.message || 'Error occurred' }, { status: 500 });
    }
}
