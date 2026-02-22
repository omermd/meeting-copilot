# Sidekick V3 - AI Meeting Assistant

**Sidekick** is a specialized meeting assistant designed to act as your "silent partner" during client calls. It doesn't just transcribe—it analyzes the conversation in real-time, providing you with proactive technical advice, customer insights, and strategic guidance to help you win the room.

## ✨ New in V3: Automated Meeting Minutes
- **End-of-Meeting Artifacts:** When you stop the meeting, Sidekick uses **Gemini 2.0 Flash** to automatically summarize the entire transcript.
- **Context-Aware Summaries:** The generated notes natively cross-reference your uploaded context files (SOWs, TDDs) and project goals to provide highly relevant Executive Summaries, Decisions, Action Items, and Risks.
- **Instant Markdown Download:** Automatically downloads a clean `.md` file containing your structured meeting notes.

## ⏪ New in V2: Architecture & Setup
- **Next.js Migration:** Rebuilt the entire stack with Next.js (App Router) for improved performance and server-side capabilities.
- **Server-Side Context Caching:** Implemented Gemini Context Caching to handle large document sets (PDFs, DOCX) efficiently, reducing latency and cost.
- **Dynamic Projects:** Create dedicated workspaces for different meetings with custom goals and uploaded context files.
- **Improved UI:** Refined dashboard with a focus on real-time feedback and glassmorphic design.

## 🚀 Key Features
- **Passive Listening:** Uses Deepgram for live transcription and Gemini to analyze the conversation without you needing to take manual notes.
- **Expert Persona:** Responses are framed in the first person ("I recommend...", "We should consider...") so you can bridge the gap between listening and speaking seamlessly.
- **Context Awareness:** Upload PDFs, DOCX, or text files to provide the AI with specific project context.

## 🛠 Project Configuration

In V2, behavior can be customized via the UI and project-specific settings.

### 1. Global System Instructions
The base personality of the assistant is defined in the Gemini API configuration within the server-side routes (`app/api/setup/route.ts`).

### 2. Meeting-Specific Refinements (UI)
In the dashboard, you can define:
- **Project Goals:** Specific outcomes you want to achieve for the meeting.
- **Project Context:** Uploaded files that act as the knowledge base for the sessions.

## 🏃 Run Locally

**Prerequisites:** Node.js 18+

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Configuration:**
    Set your API keys in `.env.local`:
    - `GEMINI_API_KEY`: Your Google Gemini API key.
    - `DEEPGRAM_API_KEY`: Your Deepgram API key for transcription.
3.  **Run the app:**
    ```bash
    npm run dev
    ```

---
View your app in AI Studio: https://aistudio.corp.google.com/apps/temp/1
