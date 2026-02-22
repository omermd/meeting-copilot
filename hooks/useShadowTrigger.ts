import { useRef, useCallback, useEffect, useState } from 'react';
import { ShadowTriggerConfig, DEFAULT_TRIGGER_CONFIG, TriggerReason } from '../types';

/**
 * Question detection patterns — catches when someone in the meeting asks something
 */
const QUESTION_PATTERNS = [
    /\?\s*$/,                                    // Ends with ?
    /\bwhat\s+(is|are|do|does|would|should|can|will)\b/i,
    /\bhow\s+(do|does|can|would|should|will|is|are)\b/i,
    /\bwhy\s+(is|are|do|does|would|should|can|will|did)\b/i,
    /\bcan\s+(you|we|i|they)\b/i,
    /\bcould\s+(you|we|i|they)\b/i,
    /\bshould\s+(we|i|they)\b/i,
    /\bwould\s+(you|it|this|that)\b/i,
    /\bis\s+(there|it|this|that)\b/i,
    /\bare\s+(there|you|we|they)\b/i,
    /\bdo\s+(you|we|they)\s+have\b/i,
    /\bwhat's\s+the\b/i,
    /\bhow's\s+that\b/i,
    /\btell\s+me\s+about\b/i,
    /\bexplain\b/i,
    /\bwhat\s+about\b/i,
];

interface UseShadowTriggerProps {
    /** Reference to a function that provides the current transcript buffer */
    getTranscriptBuffer: () => string;
    /** Callback fired when a trigger condition is met */
    onTrigger: (buffer: string, reason: TriggerReason) => void;
    /** Whether the trigger engine is active */
    isActive: boolean;
    /** Configuration */
    config?: Partial<ShadowTriggerConfig>;
}

interface UseShadowTriggerReturn {
    /** Manually fire the trigger */
    manualTrigger: () => void;
    /** Whether the trigger is on cooldown */
    isOnCooldown: boolean;
    /** Seconds until next auto-trigger */
    secondsUntilNext: number;
    /** Feed new transcript text for question detection */
    feedText: (text: string) => void;
}

export const useShadowTrigger = ({
    getTranscriptBuffer,
    onTrigger,
    isActive,
    config: partialConfig,
}: UseShadowTriggerProps): UseShadowTriggerReturn => {
    const config: ShadowTriggerConfig = {
        ...DEFAULT_TRIGGER_CONFIG,
        ...partialConfig,
    };

    const [isOnCooldown, setIsOnCooldown] = useState(false);
    const [secondsUntilNext, setSecondsUntilNext] = useState(config.intervalSeconds);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const cooldownRef = useRef<NodeJS.Timeout | null>(null);
    const lastTriggerTimeRef = useRef(0);
    const pendingTextRef = useRef('');

    // ─── Use REFS for callbacks to avoid stale closures in setInterval ─────
    // This is the key fix: setInterval captures closures at creation time.
    // By using refs, the interval always calls the latest version of these functions.
    const getTranscriptBufferRef = useRef(getTranscriptBuffer);
    const onTriggerRef = useRef(onTrigger);

    useEffect(() => {
        getTranscriptBufferRef.current = getTranscriptBuffer;
    }, [getTranscriptBuffer]);

    useEffect(() => {
        onTriggerRef.current = onTrigger;
    }, [onTrigger]);

    /**
     * Check if text contains a question pattern
     */
    const detectQuestion = useCallback((text: string): boolean => {
        return QUESTION_PATTERNS.some(pattern => pattern.test(text));
    }, []);

    /**
     * Fire the trigger if conditions are met
     */
    const fireTrigger = useCallback(
        (reason: TriggerReason) => {
            const now = Date.now();
            const timeSinceLastTrigger = (now - lastTriggerTimeRef.current) / 1000;

            // Respect cooldown
            if (timeSinceLastTrigger < config.cooldownSeconds && reason !== 'manual') {
                console.log(`[ShadowTrigger] On cooldown (${Math.round(config.cooldownSeconds - timeSinceLastTrigger)}s remaining)`);
                return;
            }

            const buffer = getTranscriptBufferRef.current();

            // Check minimum buffer length (bypass for manual)
            if (buffer.length < config.minBufferLength && reason !== 'manual') {
                console.log(`[ShadowTrigger] Buffer too short (${buffer.length} < ${config.minBufferLength})`);
                return;
            }

            console.log(`[ShadowTrigger] 🔥 Trigger fired! Reason: ${reason}, Buffer length: ${buffer.length}`);
            lastTriggerTimeRef.current = now;

            // Start cooldown
            setIsOnCooldown(true);
            if (cooldownRef.current) clearTimeout(cooldownRef.current);
            cooldownRef.current = setTimeout(() => {
                setIsOnCooldown(false);
            }, config.cooldownSeconds * 1000);

            // Reset countdown
            setSecondsUntilNext(config.intervalSeconds);

            onTriggerRef.current(buffer, reason);
        },
        [config.cooldownSeconds, config.minBufferLength, config.intervalSeconds]
    );

    /**
     * Manual trigger — bypasses cooldown and minimum buffer requirements
     */
    const manualTrigger = useCallback(() => {
        fireTrigger('manual');
    }, [fireTrigger]);

    /**
     * Feed new transcript text for real-time question detection
     */
    const feedText = useCallback(
        (text: string) => {
            if (!isActive || !config.triggerOnQuestions) return;

            pendingTextRef.current += ' ' + text;

            // Check the accumulated text for questions
            if (detectQuestion(pendingTextRef.current)) {
                console.log('[ShadowTrigger] ❓ Question detected:', pendingTextRef.current.trim().slice(-60));
                pendingTextRef.current = '';
                fireTrigger('question_detected');
            }

            // Keep the pending text buffer from growing too large
            if (pendingTextRef.current.length > 500) {
                pendingTextRef.current = pendingTextRef.current.slice(-200);
            }
        },
        [isActive, config.triggerOnQuestions, detectQuestion, fireTrigger]
    );

    /**
     * Timer-based auto-trigger — uses STABLE refs so the interval doesn't reset
     * on every transcript update.
     */
    useEffect(() => {
        if (!isActive) {
            // Clean up when deactivated
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            setSecondsUntilNext(config.intervalSeconds);
            return;
        }

        // Start countdown display
        let countdown = config.intervalSeconds;
        setSecondsUntilNext(countdown);

        countdownRef.current = setInterval(() => {
            countdown -= 1;
            if (countdown < 0) countdown = config.intervalSeconds;
            setSecondsUntilNext(countdown);
        }, 1000);

        // Start periodic trigger — fireTrigger is stable now because it uses refs
        intervalRef.current = setInterval(() => {
            fireTrigger('timer');
            countdown = config.intervalSeconds;
            setSecondsUntilNext(countdown);
        }, config.intervalSeconds * 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [isActive, config.intervalSeconds, fireTrigger]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (cooldownRef.current) clearTimeout(cooldownRef.current);
        };
    }, []);

    return {
        manualTrigger,
        isOnCooldown,
        secondsUntilNext,
        feedText,
    };
};
