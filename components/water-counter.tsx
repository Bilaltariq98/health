"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { today } from "@/lib/utils";

interface WaterCounterProps {
  initialGlasses: number;
}

export function WaterCounter({ initialGlasses }: WaterCounterProps) {
  const [glasses, setGlasses] = useState(initialGlasses);
  const [saving, setSaving] = useState(false);
  const target = config.nutrition.waterTargetGlasses;

  async function update(next: number) {
    const clamped = Math.max(0, Math.min(next, 20));
    setGlasses(clamped);
    setSaving(true);
    await fetch("/api/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today(), glasses: clamped }),
    });
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1 flex-wrap flex-1">
        {Array.from({ length: target }).map((_, i) => (
          <button
            key={i}
            onClick={() => update(i < glasses ? i : i + 1)}
            className="transition-all"
            aria-label={`${i + 1} glass${i + 1 !== 1 ? "es" : ""}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={i < glasses ? "var(--primary)" : "none"} stroke={i < glasses ? "var(--primary)" : "var(--border)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3h14l-2 16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 3z"/>
            </svg>
          </button>
        ))}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold tabular-nums">{glasses}<span className="text-sm font-normal text-[var(--muted-foreground)]">/{target}</span></p>
        <p className="text-xs text-[var(--muted-foreground)]">{saving ? "saving…" : "glasses"}</p>
      </div>
    </div>
  );
}
