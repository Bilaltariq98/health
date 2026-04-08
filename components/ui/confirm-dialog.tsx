"use client";

import { useRef, useEffect, useCallback } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === ref.current) onCancel();
    },
    [onCancel],
  );

  return (
    <dialog
      ref={ref}
      onCancel={onCancel}
      onClick={handleBackdropClick}
      className={cn(
        "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 m-0",
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        "bg-[var(--card)] text-[var(--card-foreground)]",
        "rounded-[var(--radius-lg)] border border-[var(--border)]",
        "p-6 w-[min(calc(100vw-2rem),20rem)] shadow-xl",
      )}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="text-sm text-[var(--muted-foreground)] mt-2">{description}</p>
      )}
      <div className="flex gap-3 mt-6">
        <Button
          variant="secondary"
          size="md"
          className="flex-1"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "destructive" ? "destructive" : "primary"}
          size="md"
          className="flex-1"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "..." : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
