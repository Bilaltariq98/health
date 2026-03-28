import { db } from "@/lib/db/client";
import { measurements } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { formatWeight } from "@/lib/config";
import { formatSessionDate } from "@/lib/utils";
import { LogBodyForm } from "./log-body-form";
import Link from "next/link";

export default async function BodyMetricsPage() {
  const history = await db
    .select()
    .from(measurements)
    .orderBy(desc(measurements.date))
    .limit(30);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/progress" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <h1 className="text-xl font-semibold">Body metrics</h1>
      </div>

      <LogBodyForm />

      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">History</h2>
          <div className="space-y-2">
            {history.map((m) => (
              <Card key={m.id}>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-[var(--muted-foreground)]">{formatSessionDate(m.date)}</span>
                  <span className="text-sm font-semibold">
                    {m.weightKg != null ? formatWeight(m.weightKg) : "—"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
