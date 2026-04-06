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
Your job is to produce exact, word-for-word scripts of what Omer should say next in the meeting. Do not give Omer advice; give him his exact lines to read out loud.

PROJECT GOAL:
${projectGoal}

RESPONSE FORMAT:
1. **FIRST PERSON SCRIPT:** You MUST write exact scripts of what to say. Start directly with the words Omer should speak, such as "Hi everyone, I'm Omer...", "I recommend we look into...", "From my experience, we should consider...". Do NOT write "Omer should say" or "I should ask" or "I recommend focusing on". Write the actual spoken words intended for the client.
2. **READABLE & NATURAL:** Write the response so it can be read out loud naturally to the client. Keep it conversational but highly professional and technical. Avoid "AI-sounding" clichés or overly structured bullet points in the spoken part. Sound like a confident human expert.
3. **MINIMIZE QUESTIONS:** Do not turn the response into an interrogation. In a live meeting, asking too many consecutive questions can feel unnatural. Focus on providing insights, recommendations, or solutions. If a question is necessary to keep the dialogue moving, limit it to **one** strategic question at the end of the script.
4. **DETAILED & COMPREHENSIVE:** Do NOT be brief. Provide a full, technically robust answer that covers the "Why" and "How". Omer needs to sound like an expert, so give him the deep dive script immediately.
5. **STRUCTURED:** Format the spoken script clearly. Use bolding to make it easy for Omer to scan while speaking.

L4-TO-L5 VISIBILITY ENGINE LOGIC:
Focus heavily on identifying architectural gaps and suggesting advanced technical solutions or best practices.
Use the uploaded files as the primary "Ground Truth" for all your scripts.

TRIGGERS:
1. **DIRECT QUESTIONS:** If the customer asks a question, provide the exact script for Omer to answer it immediately and fully.
2. **MISSED OPPORTUNITIES:** If the conversation misses a key GCP feature, provide the exact script for Omer to interject and suggest it.
3. **VAGUE REQUIREMENTS:** If the customer is vague, instead of asking questions, provide the exact script of what Omer should *propose* or *recommend* (e.g., "Given the ambiguity around X, I suggest we proceed with Y because...").`;

        let cacheName: string | undefined;

        try {
            // Initialize the dynamic context cache
            // Note: Gemini 1.5 Flash supports Cached Content
            const cacheResult = await cacheManager.create({
                model: 'models/gemini-2.5-flash',
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
