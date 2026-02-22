import React, { useEffect, useRef, useCallback } from 'react';
import { TranscriptSegment, ConsultantCard } from '../types';
import {
  User,
  Sparkles,
  Loader2,
  FileText,
  Lightbulb,
  Bot,
  HelpCircle,
  Timer,
  MousePointerClick,
  MessageCircleQuestion,
  ArrowDown,
} from 'lucide-react';

interface LiveFeedProps {
  segments: TranscriptSegment[];
  cards: ConsultantCard[];
  status: string;
  interimText: string;
  isThinking: boolean;
  streamingModelText: string;
}

const getTriggerIcon = (reason: string) => {
  switch (reason) {
    case 'question_detected':
      return <MessageCircleQuestion className="w-3 h-3" />;
    case 'timer':
      return <Timer className="w-3 h-3" />;
    case 'manual':
      return <MousePointerClick className="w-3 h-3" />;
    default:
      return <Sparkles className="w-3 h-3" />;
  }
};

const getTriggerLabel = (reason: string) => {
  switch (reason) {
    case 'question_detected':
      return 'Question Detected';
    case 'timer':
      return 'Auto Check-in';
    case 'manual':
      return 'Manual';
    default:
      return 'Suggestion';
  }
};

/**
 * Check if a scrollable container is near the bottom (within threshold px).
 * If the user has scrolled up, this returns false and auto-scroll is paused.
 */
const isNearBottom = (el: HTMLElement, threshold = 150): boolean => {
  const { scrollTop, scrollHeight, clientHeight } = el;
  return scrollHeight - scrollTop - clientHeight <= threshold;
};

export const LiveFeed: React.FC<LiveFeedProps> = ({
  segments,
  cards,
  status,
  interimText,
  isThinking,
  streamingModelText,
}) => {
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const suggestionEndRef = useRef<HTMLDivElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const cardsScrollRef = useRef<HTMLDivElement>(null);

  // Track whether user has scrolled away from bottom
  const userScrolledCardsRef = useRef(false);
  const userScrolledTranscriptRef = useRef(false);

  // Smart auto-scroll for Transcript — only if user is near bottom
  useEffect(() => {
    if (interimText || segments.length > 0) {
      const el = transcriptScrollRef.current;
      if (el && isNearBottom(el)) {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [segments, interimText]);

  // Smart auto-scroll for Cards — only if user is near bottom
  useEffect(() => {
    if (streamingModelText || cards.length > 0) {
      const el = cardsScrollRef.current;
      if (el && isNearBottom(el)) {
        suggestionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [cards, streamingModelText]);

  // Scroll-to-bottom handler for the "↓" button
  const scrollCardsToBottom = useCallback(() => {
    suggestionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollTranscriptToBottom = useCallback(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const hasContent = segments.length > 0 || cards.length > 0 || interimText || streamingModelText;

  // Disconnected / Empty Landing State
  if (!hasContent && status === 'disconnected') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center h-full font-sans">
        <Bot className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium text-gray-400">Silent Observer Mode</p>
        <p className="text-sm max-w-md mt-2">
          Connect to start listening. Deepgram transcribes in real-time on the left.
          Gemini Flash generates Consultant Cards on the right — automatically or on demand.
        </p>
        <div className="mt-6 flex items-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500/40" />
            Deepgram STT
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500/40" />
            Gemini Flash
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500/40" />
            Shadow Trigger
          </div>
        </div>
      </div>
    );
  }

  // Split View Layout
  return (
    <div className="flex h-full overflow-hidden font-sans">
      {/* LEFT COLUMN: LIVE TRANSCRIPT */}
      <div className="flex-1 flex flex-col border-r border-gray-800 bg-gray-900/30 min-w-0">
        <div className="h-12 border-b border-gray-800 flex items-center px-4 gap-2 bg-gray-900/50 sticky top-0 z-10 backdrop-blur-sm shrink-0">
          <FileText className="w-4 h-4 text-emerald-500" />
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Live Transcript</h2>
          <span className="text-[10px] text-gray-600 ml-1 font-mono">Deepgram Nova-3</span>
          {status === 'connected' && (
            <span className="flex items-center gap-1.5 ml-auto bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full text-[10px] font-medium border border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        <div ref={transcriptScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {status === 'connected' && segments.length === 0 && !interimText && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center animate-pulse">
                <User className="w-4 h-4" />
              </div>
              <p className="text-sm italic">Listening for speech...</p>
            </div>
          )}

          {segments.map((seg) => (
            <div key={seg.id} className="group">
              <div className="flex items-baseline gap-3 mb-0.5">
                <span className="text-xs font-mono text-gray-500 shrink-0">
                  {seg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-xs font-bold text-emerald-400/70">
                  {seg.speaker || 'Room'}
                </span>
              </div>
              <div className="pl-11">
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{seg.text}</p>
              </div>
            </div>
          ))}

          {interimText && (
            <div className="group">
              <div className="flex items-baseline gap-3 mb-0.5">
                <span className="text-xs font-mono text-gray-500 shrink-0">Now</span>
                <span className="text-xs font-bold text-emerald-400/70">Room</span>
              </div>
              <div className="pl-11">
                <p className="text-gray-400 text-sm leading-relaxed italic">
                  {interimText}
                  <span className="inline-block w-1.5 h-3 bg-emerald-500 ml-1 align-middle animate-pulse" />
                </p>
              </div>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* RIGHT COLUMN: CONSULTANT CARDS */}
      <div className="flex-1 flex flex-col bg-gray-950 min-w-0 relative">
        <div className="h-12 border-b border-gray-800 flex items-center px-4 gap-2 bg-gray-950 sticky top-0 z-10 shrink-0">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <h2 className="text-xs font-bold text-brand-400 uppercase tracking-wider">Consultant Cards</h2>
          <span className="text-[10px] text-gray-600 ml-1 font-mono">Gemini Flash</span>
          {cards.length > 0 && (
            <span className="ml-auto bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full text-[10px] font-medium border border-brand-500/20">
              {cards.length} card{cards.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div ref={cardsScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {status === 'connected' && cards.length === 0 && !streamingModelText && !isThinking && (
            <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-2 opacity-50">
              <Sparkles className="w-8 h-8 text-gray-800" />
              <p className="text-sm italic text-center">
                Waiting to generate your first Consultant Card...
                <br />
                <span className="text-xs text-gray-600 mt-1 block">
                  Auto-triggers every 30s or when a question is detected
                </span>
              </p>
            </div>
          )}

          {cards.map((card) => (
            <div
              key={card.id}
              className="relative bg-brand-900/10 border border-brand-500/20 rounded-xl p-4 shadow-sm transition-all hover:border-brand-500/40 hover:bg-brand-900/20 group"
            >
              <div className="absolute top-4 right-4 text-[10px] text-gray-600 font-mono">
                {card.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-brand-500/20 flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <span className="text-xs text-brand-300 font-bold uppercase tracking-wide">
                  Consultant Card
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                  {getTriggerIcon(card.triggerReason)}
                  {getTriggerLabel(card.triggerReason)}
                </span>
              </div>
              <div className="prose prose-invert max-w-none text-sm leading-relaxed text-gray-200 font-medium whitespace-pre-wrap">
                {card.text}
              </div>
            </div>
          ))}

          {(isThinking || streamingModelText) && (
            <div className="bg-brand-900/5 border border-dashed border-brand-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                </div>
                <span className="text-xs text-brand-300 font-bold uppercase tracking-wide animate-pulse">
                  Generating Card...
                </span>
              </div>
              {streamingModelText ? (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {streamingModelText}
                  <span className="inline-block w-1.5 h-3 bg-brand-500 ml-1 animate-pulse align-middle" />
                </p>
              ) : (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing transcript buffer...</span>
                </div>
              )}
            </div>
          )}
          <div ref={suggestionEndRef} />
        </div>

        {/* Floating scroll-to-bottom button — visible when user scrolls up */}
        {(isThinking || streamingModelText) && cardsScrollRef.current && !isNearBottom(cardsScrollRef.current) && (
          <button
            onClick={scrollCardsToBottom}
            className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white px-3 py-2 rounded-full text-xs font-medium shadow-lg shadow-brand-500/30 transition-all animate-bounce"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            New content
          </button>
        )}
      </div>
    </div>
  );
};