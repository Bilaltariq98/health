"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface RestTimerProps {
  seconds: number;
  presets: number[];
  onComplete: () => void;
  onDismiss: () => void;
  onChangePreset: (seconds: number) => void;
}

export function RestTimer({
  seconds,
  presets,
  onComplete,
  onDismiss,
  onChangePreset,
}: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Reset when `seconds` prop changes (user picks a different preset)
  useEffect(() => {
    setRemaining(seconds);
    setRunning(true);
  }, [seconds]);

  // Countdown
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          playDone();
          vibrate();
          onComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running, onComplete]);

  const playDone = useCallback(() => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      // Three short beeps — unmissable without being annoying
      [0, 0.15, 0.3].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.12);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.12);
      });
    } catch {
      // AudioContext blocked (e.g. no user gesture yet) — silent fallback
    }
  }, []);

  const vibrate = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, []);

  const progress = remaining / seconds;
  const circumference = 2 * Math.PI * 54; // r=54
  const strokeDashoffset = circumference * (1 - progress);

  // Colour shifts: green → amber → red as time runs out
  const ringColour =
    progress > 0.5
      ? "var(--success)"
      : progress > 0.25
      ? "var(--warning)"
      : "var(--destructive)";

  return (
    // Full-screen overlay — impossible to miss
    <div className="absolute inset-0 z-50 bg-[var(--background)]/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 px-6">
      {/* Circular countdown */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
          {/* Track */}
          <circle
            cx="72" cy="72" r="54"
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="72" cy="72" r="54"
            fill="none"
            stroke={ringColour}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
          />
        </svg>
        <div className="text-center">
          <span className="text-4xl font-bold font-mono tabular-nums">
            {formatDuration(remaining)}
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">rest</p>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => {
              onChangePreset(p);
              setRemaining(p);
              setRunning(true);
            }}
            className={cn(
              "h-10 px-3 rounded-[var(--radius)] text-sm font-medium transition-colors",
              p === seconds
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            {p >= 60 ? `${p / 60}m` : `${p}s`}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="h-12 px-5 rounded-[var(--radius)] bg-[var(--secondary)] text-sm font-medium hover:bg-[var(--muted)] transition-colors"
        >
          {running ? "Pause" : "Resume"}
        </button>
        <button
          onClick={onDismiss}
          className="h-12 px-5 rounded-[var(--radius)] bg-[var(--secondary)] text-sm font-medium hover:bg-[var(--muted)] transition-colors"
        >
          Skip rest
        </button>
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">
        Tap a preset to reset the timer
      </p>
    </div>
  );
}
