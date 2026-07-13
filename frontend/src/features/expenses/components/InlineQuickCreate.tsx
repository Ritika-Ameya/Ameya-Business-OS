import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface InlineQuickCreateProps {
  label: string;
  onCreate: (name: string) => void | Promise<void>;
}

export function InlineQuickCreate({ label, onCreate }: InlineQuickCreateProps) {
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const trimmed = value.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      await onCreate(trimmed);
      setValue("");
      setExpanded(false);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setValue("");
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="h-6 rounded-md px-2 text-xs"
        onClick={() => setExpanded(true)}
      >
        + Create {label}
      </Button>
    );
  }

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`New ${label.toLowerCase()}`}
        className="h-8 min-w-[140px] rounded-lg text-xs"
        autoFocus
        disabled={creating}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void handleCreate();
          }
          if (e.key === "Escape") {
            handleCancel();
          }
        }}
      />
      <Button
        type="button"
        size="xs"
        className="h-8 rounded-lg px-2 text-xs"
        onClick={() => void handleCreate()}
        disabled={creating}
      >
        {creating ? "Adding..." : "Add"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="h-8 rounded-lg px-2 text-xs"
        onClick={handleCancel}
        disabled={creating}
      >
        Cancel
      </Button>
    </div>
  );
}
