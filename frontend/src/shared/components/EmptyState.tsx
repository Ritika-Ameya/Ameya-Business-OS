import type { LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20",
        "bg-gradient-to-b from-blue-500/5 via-violet-500/5 to-transparent px-6 py-14 text-center sm:py-16",
        className
      )}
    >
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-primary ring-1 ring-primary/20 shadow-sm">
        <Icon className="size-7" aria-hidden />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {(actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
