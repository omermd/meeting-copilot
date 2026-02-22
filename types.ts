// ─── Core Message Types ───────────────────────────────────────────────────────

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isPartial?: boolean;
}

/** A "Consultant Card" — one AI suggestion generated from a context buffer snapshot */
export interface ConsultantCard {
  id: string;
  text: string;
  timestamp: Date;
  triggerReason: TriggerReason;
  /** The transcript window that was sent to Gemini to produce this card */
  contextSnapshot: string;
}

export type TriggerReason = 'timer' | 'question_detected' | 'manual';

// ─── Context Files ────────────────────────────────────────────────────────────

export interface ContextFile {
  name: string;
  data: string; // text content or base64 string
  mimeType: string;
  isBinary: boolean;
}

// ─── Connection & Session Status ──────────────────────────────────────────────

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface AudioConfig {
  sampleRate: number;
}

// ─── Transcript Buffer Types ──────────────────────────────────────────────────

export interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: Date;
  isFinal: boolean;
  /** Speaker label if diarization is available */
  speaker?: string;
}

// ─── Shadow Trigger Config ────────────────────────────────────────────────────

export interface ShadowTriggerConfig {
  /** Interval in seconds between automatic Gemini calls (default: 30) */
  intervalSeconds: number;
  /** Whether to trigger on detected questions (default: true) */
  triggerOnQuestions: boolean;
  /** Minimum characters in buffer before triggering (default: 50) */
  minBufferLength: number;
  /** Cooldown in seconds after a trigger before another can fire (default: 10) */
  cooldownSeconds: number;
}

export const DEFAULT_TRIGGER_CONFIG: ShadowTriggerConfig = {
  intervalSeconds: 30,
  triggerOnQuestions: true,
  minBufferLength: 50,
  cooldownSeconds: 10,
};