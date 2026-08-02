import { RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";

interface FilterResetButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function FilterResetButton({
  onClick,
  label = "Reset filters",
  className,
}: FilterResetButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("rounded-xl text-muted-foreground", className)}
      onClick={onClick}
      aria-label={label}
    >
      <RotateCcw className="size-3.5" aria-hidden />
      {label}
    </Button>
  );
}
