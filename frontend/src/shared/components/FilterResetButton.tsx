import { RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface FilterResetButtonProps {
  onClick: () => void;
  label?: string;
}

export function FilterResetButton({
  onClick,
  label = "Reset filters",
}: FilterResetButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="rounded-xl text-muted-foreground"
      onClick={onClick}
      aria-label={label}
    >
      <RotateCcw className="size-3.5" aria-hidden />
      {label}
    </Button>
  );
}
