import { Loader2 } from "lucide-react";

export function RouteFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
      <Loader2 className="size-6 animate-spin" aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  );
}
