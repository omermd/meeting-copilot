# Silent Observer (Technical Co-pilot)

**Silent Observer** is a real-time, AI-powered meeting assistant designed for technical professionals, such as Google Cloud PSO (Professional Services Organization) engineers. It acts as your "Technical Co-pilot" or "Silent Wingman," listening to your live meetings and providing deep-dive technical insights synchronously.

## 🚀 Use Case

When you're in a high-stakes technical meeting or discovery session:
- **Expert Suggestions:** The app produces "Consultant Cards" that offer technically robust suggestions, covering not just the "what" but the "why" and "how."
- **Passive Listening:** It uses Deepgram for live transcription and Gemini to analyze the conversation without you needing to take manual notes.
- **Expert Persona:** Responses are framed in the first person ("I recommend...", "We should consider...") so you can bridge the gap between listening and speaking seamlessly.
- **Context Awareness:** Upload PDFs, DOCX, or text files (like architecture diagrams or requirement docs) to provide the AI with specific project context.

## 🛠 How to Change the Prompt

Depending on your needs, you can adjust the AI's behavior in two ways:

### 1. Meeting-Specific Refinements (UI)
In the **Context Panel** (on the left side of the app), use the **"Custom Instructions"** box.
- Use this for transient instructions like: *"Focus on GKE security features today"* or *"The customer is very concerned about cost optimization."*
- These instructions are appended to the core system prompt for that session.

### 2. Core Behavior & Persona (Code)
To change the fundamental role, tone, or triggers of the AI:
1. Open [`App.tsx`](App.tsx).
2. Locate the `systemInstruction` constant (near line 14).
3. Edit the `textPrompt` variable. Here you can modify:
   - The **Persona** (e.g., change from PSO Engineer to a Solutions Architect).
   - The **Response Format** (bullet points, first-person style, etc.).
   - The **Triggers** (when the AI should generate a suggestion).

## 🏃 Run Locally

**Prerequisites:** Node.js

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

