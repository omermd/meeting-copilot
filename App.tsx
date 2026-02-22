import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { ContextPanel } from './components/ContextPanel';
import { LiveFeed } from './components/LiveFeed';
import { useSilentObserver } from './hooks/useSilentObserver';
import { ContextFile } from './types';

const App = () => {
  const [files, setFiles] = useState<ContextFile[]>([]);
  const [instructions, setInstructions] = useState('');

  // Construct the system instruction for Gemini (unchanged from before)
  const systemInstruction = useMemo(() => {
    const textPrompt = `You are an expert Google Cloud Engineer assistant working in PSO (Professional Services Organization). 
    
    ROLE:
    You are Omer's "Technical Co-pilot" — a Silent Wingman. Omer is in a meeting and you are listening passively via a live transcript.
    Your job is to analyze the conversation and produce "Consultant Cards" — concise but technically deep suggestions.
    
    RESPONSE FORMAT:
    1.  **FIRST PERSON:** Speak as if YOU are Omer. Start sentences with "I recommend...", "We should consider...", "In my experience...".
    2.  **DETAILED & COMPREHENSIVE:** Do NOT be brief. Provide a full, technically robust answer that covers the "Why" and "How". Omer needs to sound like an expert, so give the deep dive immediately.
    3.  **DIVING DEEP:** If a topic is mentioned (e.g., GKE Autopilot), explain the benefits, trade-offs, and security implications in detail.
    4.  **STRUCTURED:** Use bullet points, numbered lists, and bold text for easy scanning during a live meeting.
    
    TRIGGERS:
    1.  **DIRECT QUESTIONS:** If the customer asks a question, answer it immediately and fully.
    2.  **MISSED OPPORTUNITIES:** If the conversation misses a key GCP feature (e.g., not mentioning Private Service Connect when discussing networking), jump in with a detailed suggestion on why we should use it.
    3.  **VAGUE REQUIREMENTS:** If the customer is vague, provide a script for Omer to ask discovery questions, explaining *why* we need to know that information.

    DO NOT summarize the meeting.
    DO NOT be conversational with Omer (e.g. don't say "Here is a suggestion"). Just give the content to speak.
    
    ${instructions.trim() ? `\nUSER INSTRUCTIONS:\n${instructions}` : ''}
    `;

    const parts: any[] = [{ text: textPrompt }];

    if (files.length > 0) {
      parts.push({ text: "\nHere are the context files for this meeting. Use the information in these files to answer questions accurately:\n" });

      files.forEach(f => {
        if (f.isBinary && f.data) {
          parts.push({
            inlineData: {
              mimeType: f.mimeType,
              data: f.data
            }
          });
        } else if (f.data) {
          parts.push({
            text: `\n--- START FILE: ${f.name} ---\n${f.data}\n--- END FILE ---\n`
          });
        }
      });
    }

    return { parts };
  }, [files, instructions]);

  // ─── The Silent Observer: Deepgram + Gemini + Shadow Trigger ──────────────
  const {
    status,
    segments,
    interimText,
    cards,
    isThinking,
    streamingModelText,
    secondsUntilNext,
    isOnCooldown,
    connect,
    disconnect,
    manualTrigger,
  } = useSilentObserver({
    deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
    geminiApiKey: process.env.API_KEY || '',
    systemInstruction,
    contextFiles: files,
    triggerConfig: {
      intervalSeconds: 30,
      triggerOnQuestions: true,
      minBufferLength: 50,
      cooldownSeconds: 10,
    },
  });

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-sans">
      <Header
        status={status}
        connect={connect}
        disconnect={disconnect}
        secondsUntilNext={secondsUntilNext}
        isOnCooldown={isOnCooldown}
        isThinking={isThinking}
        manualTrigger={manualTrigger}
      />

      <div className="flex-1 flex overflow-hidden">
        <ContextPanel
          files={files}
          setFiles={setFiles}
          instructions={instructions}
          setInstructions={setInstructions}
          disabled={status === 'connected' || status === 'connecting'}
        />

        <main className="flex-1 flex flex-col bg-gray-950 relative">
          <LiveFeed
            segments={segments}
            cards={cards}
            status={status}
            interimText={interimText}
            isThinking={isThinking}
            streamingModelText={streamingModelText}
          />
        </main>
      </div>
    </div>
  );
};

export default App;