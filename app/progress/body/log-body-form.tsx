"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { today } from "@/lib/utils";
import { weightPlaceholder } from "@/lib/config";

export function LogBodyForm() {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);

    await fetch("/api/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: nanoid(),
        date: today(),
        weightKg: parseFloat(weight),
        notes: notes.trim() || undefined,
        measuredAt: new Date().toISOString(),
      }),
    });

    setWeight("");
    setNotes("");
    setSaving(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-[var(--muted-foreground)] mb-1 block font-medium">
              Bodyweight ({weightPlaceholder})
            </label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder={`e.g. 103`}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.1"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted-foreground)] mb-1 block font-medium">
              Notes <span className="opacity-60">(optional)</span>
            </label>
            <Input
              placeholder="e.g. morning, fasted"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={saving || !weight}>
            {saving ? "Saving…" : "Log weight"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
