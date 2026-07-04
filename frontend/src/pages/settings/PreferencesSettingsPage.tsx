import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useSettings } from "@/hooks/use-settings";
import {
  currencyFormatOptions,
  dateFormatOptions,
  themeOptions,
  timeZoneOptions,
} from "@/lib/settings-utils";
import type { PreferencesSettings } from "@/types/settings";

export function PreferencesSettingsPage() {
  const { preferences, updatePreferences } = useSettings();
  const [form, setForm] = useState<PreferencesSettings>(preferences);
  const [saved, setSaved] = useState(false);

  const updateField = <K extends keyof PreferencesSettings>(
    field: K,
    value: PreferencesSettings[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updatePreferences(form);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Display formats and regional settings.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={form.theme}
              onValueChange={(value) => updateField("theme", value)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Theme toggle in the top bar remains active (placeholder).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select
              value={form.dateFormat}
              onValueChange={(value) => updateField("dateFormat", value)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateFormatOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Currency Format</Label>
            <Select
              value={form.currencyFormat}
              onValueChange={(value) => updateField("currencyFormat", value)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencyFormatOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Time Zone</Label>
            <Select
              value={form.timeZone}
              onValueChange={(value) => updateField("timeZone", value)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeZoneOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-6">
          <Button className="rounded-xl" onClick={handleSave}>
            Save Changes
          </Button>
          {saved && (
            <span className="text-sm text-muted-foreground">Saved locally.</span>
          )}
        </div>
      </div>
    </div>
  );
}
