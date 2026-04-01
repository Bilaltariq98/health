"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StopSessionButton({ sessionId, onStopped }: { sessionId: string; onStopped?: () => void }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [stopping, setStopping] = useState(false);

  async function handleStop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirming) {
      setConfirming(true);
      return;
    }

    setStopping(true);
    const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    if (res.ok) {
      onStopped?.();
      router.refresh();
    }
    setStopping(false);
    setConfirming(false);
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.preventDefault()}>
        <button
          onClick={handleStop}
          disabled={stopping}
          className="px-3 py-1.5 rounded-[var(--radius)] bg-[var(--destructive)] text-[var(--destructive-foreground)] text-xs font-medium min-h-[36px] min-w-[36px]"
        >
          {stopping ? "..." : "Confirm"}
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 rounded-[var(--radius)] bg-[var(--secondary)] text-[var(--muted-foreground)] text-xs font-medium min-h-[36px] min-w-[36px]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleStop}
      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[var(--destructive)]/15 text-[var(--destructive)] hover:bg-[var(--destructive)]/25 transition-colors"
      aria-label="Stop session"
      title="Stop session"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="4" width="16" height="16" rx="2" />
      </svg>
    </button>
  );
}
