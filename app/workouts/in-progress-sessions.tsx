"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { INTENT_LABELS } from "@/lib/programme";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface InProgressSession {
  id: string;
  intent: string;
  sessionIndex: number;
  startedAt: string;
}

export function InProgressSessions({
  sessions,
  setCountMap,
}: {
  sessions: InProgressSession[];
  setCountMap: Record<string, number>;
}) {
  const router = useRouter();
  const [discardTarget, setDiscardTarget] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState(false);

  function promptDiscard(e: React.MouseEvent, sessionId: string) {
    e.preventDefault();
    e.stopPropagation();
    setDiscardTarget(sessionId);
  }

  async function confirmDiscard() {
    if (!discardTarget) return;
    setDiscarding(true);
    const res = await fetch(`/api/sessions/${discardTarget}`, { method: "DELETE" });
    setDiscarding(false);
    setDiscardTarget(null);
    if (res.ok) router.refresh();
  }

  return (
    <>
      <div className="space-y-2">
        {sessions.map((s) => (
          <Link key={s.id} href={`/workouts/active?session=${s.sessionIndex}&id=${s.id}`}>
            <div className="rounded-[var(--radius-lg)] bg-[var(--warning)]/10 border border-[var(--warning)]/30 px-4 py-3 flex items-center gap-3 cursor-pointer">
              <div className="w-2 h-2 rounded-full bg-[var(--warning)] animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">Session in progress</span>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {INTENT_LABELS[s.intent]} · started{" "}
                  {new Date(s.startedAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" · "}
                  {setCountMap[s.id] ?? 0} sets logged
                </p>
              </div>
              <button
                onClick={(e) => promptDiscard(e, s.id)}
                disabled={discarding}
                className="relative w-11 h-11 flex items-center justify-center rounded-full pointer-hover:bg-[var(--destructive)]/20 transition-[background-color] duration-150 flex-shrink-0 -mr-1.5"
                aria-label="Discard session"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--muted-foreground)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Link>
        ))}
      </div>

      <ConfirmDialog
        open={discardTarget !== null}
        title="Discard session?"
        description="Any logged sets will be permanently deleted."
        confirmLabel="Discard"
        cancelLabel="Keep"
        variant="destructive"
        loading={discarding}
        onConfirm={confirmDiscard}
        onCancel={() => setDiscardTarget(null)}
      />
    </>
  );
}
