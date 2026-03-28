"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatWeight } from "@/lib/config";

interface DataPoint {
  date: string;
  weightKg: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: DataPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{d.date}</p>
      <p className="text-[var(--primary)] font-bold">{formatWeight(d.weightKg)}</p>
    </div>
  );
}

export function BodyweightChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-[var(--muted-foreground)]">
        No bodyweight entries yet
      </div>
    );
  }

  const min = Math.floor(Math.min(...data.map((d) => d.weightKg)) - 2);
  const max = Math.ceil(Math.max(...data.map((d) => d.weightKg)) + 2);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="bwGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[min, max]}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}kg`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="weightKg"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#bwGradient)"
          dot={{ fill: "var(--primary)", r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
