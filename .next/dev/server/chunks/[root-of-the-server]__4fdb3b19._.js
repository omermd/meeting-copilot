module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[project]/app/api/setup/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$server$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@google/generative-ai/dist/server/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$os__$5b$external$5d$__$28$os$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/os [external] (os, cjs)");
;
;
;
;
;
async function POST(req) {
    try {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing Gemini API Key'
            }, {
                status: 500
            });
        }
        const formData = await req.formData();
        const projectGoal = formData.get('projectGoal');
        if (!projectGoal) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing Project Goal'
            }, {
                status: 400
            });
        }
        const fileManager = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$server$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GoogleAIFileManager"](apiKey);
        const cacheManager = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$server$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GoogleAICacheManager"](apiKey);
        const uploadedFiles = [];
        // Process all files in formData
        for (const [key, value] of formData.entries()){
            if (key === 'files' && value instanceof File) {
                const file = value;
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                // Write to tmp dir
                const tmpPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(__TURBOPACK__imported__module__$5b$externals$5d2f$os__$5b$external$5d$__$28$os$2c$__cjs$29$__["default"].tmpdir(), file.name);
                await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].writeFile(tmpPath, buffer);
                console.log(`Uploading ${file.name} to Gemini...`);
                const uploadResult = await fileManager.uploadFile(tmpPath, {
                    mimeType: file.type || 'text/plain',
                    displayName: file.name
                });
                uploadedFiles.push(uploadResult);
                // Cleanup tmp file
                await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].unlink(tmpPath);
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
        let cacheName;
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
                        parts: uploadedFiles.map((uf)=>({
                                fileData: {
                                    mimeType: uf.file.mimeType,
                                    fileUri: uf.file.uri
                                }
                            }))
                    }
                ],
                ttlSeconds: 7200
            });
            console.log(`Cache created with name: ${cacheResult.name}`);
            cacheName = cacheResult.name;
        } catch (cacheError) {
            console.warn('Cache creation failed (possibly due to < 4096 tokens). Falling back to inline file passing.', cacheError.message);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            cacheName,
            filesContext: uploadedFiles.map((uf)=>({
                    uri: uf.file.uri,
                    mimeType: uf.file.mimeType
                }))
        });
    } catch (error) {
        console.error('Error during setup:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Error occurred'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4fdb3b19._.js.map