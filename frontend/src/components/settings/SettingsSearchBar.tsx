import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SettingsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SettingsSearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: SettingsSearchBarProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border-border/70 bg-card pl-10"
      />
    </div>
  );
}
