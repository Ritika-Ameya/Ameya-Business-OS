import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import type { BrandingFormData } from "@/features/settings/types/settings";

export function BrandingSettingsPage() {
  const { branding, updateBranding, loading, saving } = useAppConfig();
  const [draft, setDraft] = useState<BrandingFormData | null>(null);
  const form = draft ?? branding;

  const updateField = <K extends keyof BrandingFormData>(field: K, value: BrandingFormData[K]) => {
    setDraft((prev) => ({ ...(prev ?? branding), [field]: value }));
  };

  const handleSave = async () => {
    await updateBranding(form);
    setDraft(null);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading branding settings...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Branding</h2>
        <p className="text-sm text-muted-foreground">
          Logo, colors and visual identity used across the application.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="logo-url">Logo URL</Label>
            <Input
              id="logo-url"
              value={form.logoUrl}
              onChange={(e) => updateField("logoUrl", e.target.value)}
              placeholder="https://..."
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="favicon-url">Favicon URL</Label>
            <Input
              id="favicon-url"
              value={form.faviconUrl}
              onChange={(e) => updateField("faviconUrl", e.target.value)}
              placeholder="https://..."
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary-color"
                type="color"
                value={form.primaryColor}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="h-10 w-14 rounded-xl p-1"
              />
              <Input
                value={form.primaryColor}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary-color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondary-color"
                type="color"
                value={form.secondaryColor}
                onChange={(e) => updateField("secondaryColor", e.target.value)}
                className="h-10 w-14 rounded-xl p-1"
              />
              <Input
                value={form.secondaryColor}
                onChange={(e) => updateField("secondaryColor", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accent-color">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="accent-color"
                type="color"
                value={form.accentColor}
                onChange={(e) => updateField("accentColor", e.target.value)}
                className="h-10 w-14 rounded-xl p-1"
              />
              <Input
                value={form.accentColor}
                onChange={(e) => updateField("accentColor", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={form.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-6">
          <Button className="rounded-xl" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
