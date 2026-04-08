import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-foreground)] active:scale-[0.97]",
  secondary:
    "bg-[var(--secondary)] text-[var(--secondary-foreground)] active:scale-[0.97]",
  ghost:
    "bg-transparent text-[var(--foreground)] active:scale-[0.97]",
  destructive:
    "bg-[var(--destructive)] text-[var(--destructive-foreground)] active:scale-[0.97]",
};

const hoverClasses: Record<Variant, string> = {
  primary: "pointer-hover:bg-[var(--accent)]",
  secondary: "pointer-hover:bg-[var(--muted)]",
  ghost: "pointer-hover:bg-[var(--secondary)]",
  destructive: "pointer-hover:opacity-90",
};

// Sizes ensure minimum 48px tap target on mobile (Fitts's Law)
const sizeClasses: Record<Size, string> = {
  sm:  "h-9  px-3  text-sm  min-w-[36px]",
  md:  "h-11 px-4  text-sm  min-w-[44px]",
  lg:  "h-14 px-6  text-base min-w-[56px]",
  xl:  "h-16 px-8  text-lg  min-w-[64px] font-semibold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius)]",
        "font-medium transition-[background-color,color,opacity,transform] duration-150 cursor-pointer select-none",
        "focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
        variantClasses[variant],
        hoverClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";
