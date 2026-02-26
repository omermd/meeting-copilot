"use client";

import React, { useState } from 'react';
import { Header } from '../components/Header';
import { LiveFeed } from '../components/LiveFeed';
import { useSilentObserver } from '../hooks/useSilentObserver';
import { Bot, UploadCloud, FileText, Loader2, Sparkles } from 'lucide-react';

export default function App() {
    const [sessionConfig, setSessionConfig] = useState<{ cacheName?: string, filesContext?: any[], projectGoal?: string } | null>(null);

    // Setup Form State
    const [files, setFiles] = useState<File[]>([]);
    const [projectGoal, setProjectGoal] = useState<string>('');
    const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
    const [setupError, setSetupError] = useState<string | null>(null);

    // End Meeting Modal State
    const [isEndMeetingModalOpen, setIsEndMeetingModalOpen] = useState<boolean>(false);
    const [isGeneratingNotes, setIsGeneratingNotes] = useState<boolean>(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const startMeetingSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectGoal.trim()) {
            setSetupError("Project Goal is required.");
            return;
        }

        setIsSettingUp(true);
        setSetupError(null);

        try {
            const formData = new FormData();
            formData.append('projectGoal', projectGoal);
            files.forEach(file => {
                formData.append('files', file);
            });

            const res = await fetch('/api/setup', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to initialize session caching.');
            }

            setSessionConfig({
                cacheName: data.cacheName,
                filesContext: data.filesContext,
                projectGoal: projectGoal,
            });
        } catch (err: any) {
            setSetupError(err.message || "An unexpected error occurred.");
        } finally {
            setIsSettingUp(false);
        }
    };

    // ─── The Silent Observer: Deepgram + Gemini + Shadow Trigger ──────────────
    const {
        status,
        segments,
        interimText,
        formattedTranscript,
        cards,
        isThinking,
        secondsUntilNext,
        isOnCooldown,
        connect,
        disconnect,
        manualTrigger,
    } = useSilentObserver({
        deepgramApiKey: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '',
        sessionConfig,
        triggerConfig: {
            intervalSeconds: 60,
            triggerOnQuestions: true,
            minBufferLength: 50,
            cooldownSeconds: 10,
        },
    });

    const handleGenerateNotes = async () => {
        setIsGeneratingNotes(true);
        try {
            if (!formattedTranscript || formattedTranscript.trim() === '') {
                throw new Error("No transcript data available to save.");
            }

            const transcriptTitle = `# Meeting Transcript: ${new Date().toLocaleString()}\n\n`;
            const textToDownload = transcriptTitle + formattedTranscript;

            // Auto-trigger download
            const blob = new Blob([textToDownload], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            a.download = `Meeting_Transcript_${dateStr}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setIsEndMeetingModalOpen(false);
        } catch (err: any) {
            console.error('Transcript Save Error:', err);
            alert(`Failed to save transcript: ${err.message}`);
        } finally {
            setIsGeneratingNotes(false);
        }
    };

    // Setup Screen Display
    if (!sessionConfig) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-gray-100 font-google p-6">
                <div className="mb-8 text-center">
                    <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-emerald-400 mb-2">
                        sidekick
                    </h1>
                    <p className="text-gray-400 text-lg">Multi-Project Setup powered by Gemini 2.5 Flash</p>
                </div>

                <div className="max-w-xl w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-gray-800 flex items-center gap-4 bg-gray-900/50">
                        <div className="w-12 h-12 bg-brand-500/10 text-brand-400 rounded-xl flex items-center justify-center border border-brand-500/20">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Project Initialization</h2>
                            <p className="text-gray-500 text-xs mt-0.5">Configure your session context</p>
                        </div>
                    </div>

                    <form onSubmit={startMeetingSetup} className="p-8 space-y-6">
                        {setupError && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                                {setupError}
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-400" />
                                Project Documents (PDFs, TXT)
                            </label>
                            <div className="border-2 border-dashed border-gray-700 hover:border-brand-500 bg-gray-900/50 rounded-xl p-6 transition-colors text-center cursor-pointer relative group">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    accept=".pdf,.txt,.md,.csv"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <UploadCloud className="w-8 h-8 text-gray-500 group-hover:text-brand-400 transition-colors" />
                                    <p className="text-gray-400 text-sm">
                                        {files.length > 0
                                            ? `${files.length} file(s) selected`
                                            : "Drag & drop files or click to browse"}
                                    </p>
                                </div>
                            </div>
                            {files.length > 0 && (
                                <ul className="space-y-2 mt-3">
                                    {files.map((file, i) => (
                                        <li key={i} className="text-xs text-gray-400 flex items-center gap-2 bg-gray-800/50 py-1.5 px-3 rounded-md">
                                            <FileText className="w-3 h-3 text-brand-400" /> {file.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-brand-400" />
                                Project Goal / Focus
                            </label>
                            <textarea
                                value={projectGoal}
                                onChange={e => setProjectGoal(e.target.value)}
                                placeholder="e.g., 'Help me be more visible in a Data Modernization meeting. Look for architectural gaps and suggest discovery questions...'"
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 min-h-[120px] transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSettingUp}
                            className="w-full bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
                        >
                            {isSettingUp ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Staging Context Cache...
                                </>
                            ) : (
                                "Initialize Meeting Session"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Live Meeting Mode Display
    return (
        <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-google">
            <Header
                status={status}
                connect={connect}
                disconnect={disconnect}
                secondsUntilNext={secondsUntilNext}
                isOnCooldown={isOnCooldown}
                isThinking={isThinking}
                manualTrigger={manualTrigger}
                onEndMeeting={() => setIsEndMeetingModalOpen(true)}
            />

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 flex flex-col bg-gray-950 relative">
                    <LiveFeed
                        segments={segments}
                        cards={cards}
                        status={status}
                        interimText={interimText}
                        isThinking={isThinking}
                        streamingModelText={''}
                    />
                </main>
            </div>

            {/* End Meeting Modal */}
            {isEndMeetingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <h2 className="text-xl font-bold text-white mb-2">Save Meeting Transcript?</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            This will download the raw meeting transcript as a markdown file.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsEndMeetingModalOpen(false)}
                                disabled={isGeneratingNotes}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                Ignore / Close
                            </button>
                            <button
                                onClick={handleGenerateNotes}
                                disabled={isGeneratingNotes}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isGeneratingNotes ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Transcript'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
