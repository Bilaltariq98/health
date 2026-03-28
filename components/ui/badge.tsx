import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "muted" | "success" | "warning";

const variants: Record<BadgeVariant, string> = {
  default:  "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
  primary:  "bg-[var(--primary)]/20 text-[var(--primary)]",
  muted:    "bg-[var(--muted)] text-[var(--muted-foreground)]",
  success:  "bg-[var(--success)]/20 text-[var(--success)]",
  warning:  "bg-[var(--warning)]/20 text-[var(--warning)]",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
