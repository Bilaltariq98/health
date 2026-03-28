"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatWeight } from "@/lib/config";

interface DataPoint {
  date: string;
  e1rm: number;
  exerciseName: string;
  weight: number;
  reps: number;
}

interface StrengthChartProps {
  data: DataPoint[];
  pattern: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: DataPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{d.date}</p>
      <p className="text-[var(--muted-foreground)]">{d.exerciseName}</p>
      <p className="text-[var(--primary)] font-bold mt-0.5">
        {formatWeight(d.weight)} × {d.reps} reps
      </p>
      <p className="text-[var(--muted-foreground)]">~{formatWeight(d.e1rm)} e1RM</p>
    </div>
  );
}

export function StrengthChart({ data, pattern }: StrengthChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-[var(--muted-foreground)]">
        No data yet for {pattern.replace(/-/g, " ")}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}kg`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="e1rm"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ fill: "var(--primary)", r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
