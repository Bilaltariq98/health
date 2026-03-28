"use client";

interface MacroRingProps {
  label: string;
  value: number;
  target: number;
  unit: string;
  colour: string;
  size?: number;
}

export function MacroRing({ label, value, target, unit, colour, size = 72 }: MacroRingProps) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(value / target, 1);
  const offset = circumference * (1 - progress);
  const over = value > target;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="var(--border)" strokeWidth="6"
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={over ? "var(--destructive)" : colour}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold tabular-nums leading-none">{Math.round(value)}</span>
          <span className="text-[9px] text-[var(--muted-foreground)]">{unit}</span>
        </div>
      </div>
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span className="text-[10px] text-[var(--muted-foreground)]">/ {target}{unit}</span>
    </div>
  );
}
