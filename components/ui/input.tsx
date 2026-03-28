import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        // 48px height for comfortable gym-use tap target
        "h-12 w-full rounded-[var(--radius)] px-3",
        "bg-[var(--input)] border border-[var(--border)]",
        "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
        "text-base", // prevents iOS zoom on focus (must be ≥16px)
        "transition-colors",
        "focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
