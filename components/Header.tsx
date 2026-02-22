import React from 'react';
import { CloudLightning, Power, Loader2, Zap, Timer, CircleDot } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface HeaderProps {
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  secondsUntilNext: number;
  isOnCooldown: boolean;
  isThinking: boolean;
  manualTrigger: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  connect,
  disconnect,
  secondsUntilNext,
  isOnCooldown,
  isThinking,
  manualTrigger,
}) => {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
          <CloudLightning className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">sidekick</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-gray-600'}`} />
            <span className="text-xs text-gray-400 font-mono uppercase">{status}</span>
            {isConnected && (
              <span className="text-[10px] text-gray-500 font-mono ml-1">
                — Deepgram + Gemini
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Trigger Timer Display */}
        {isConnected && (
          <div className="flex items-center gap-2">
            {/* Next trigger countdown */}
            <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
              <Timer className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-mono text-gray-300 tabular-nums w-6 text-center">
                {secondsUntilNext}s
              </span>
            </div>

            {/* Manual trigger button */}
            <button
              onClick={manualTrigger}
              disabled={isThinking || isOnCooldown}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                ${isThinking
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 cursor-wait'
                  : isOnCooldown
                    ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                    : 'bg-brand-600/20 text-brand-400 border-brand-500/30 hover:bg-brand-600/30 hover:border-brand-500/50 active:scale-95'
                }
              `}
              title={isThinking ? 'Generating...' : isOnCooldown ? 'On cooldown' : 'Ask Gemini Now'}
            >
              {isThinking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>{isThinking ? 'Thinking…' : 'Ask Now'}</span>
            </button>
          </div>
        )}

        {/* Connect / Disconnect */}
        {isConnected ? (
          <button
            onClick={disconnect}
            className="flex items-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
          >
            <Power className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            <span>{isConnecting ? 'Connecting...' : 'Start Session'}</span>
          </button>
        )}
      </div>
    </header>
  );
};