import { ImageIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/shared/ui/button";
import { googleDriveApi, type GoogleDriveStatusDto } from "@/shared/api/googleDrive.api";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PhoneNumberInput } from "@/shared/components/PhoneNumberInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { uploadsApi } from "@/shared/api/uploads.api";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { currencyOptions, financialYearOptions } from "@/features/settings/utils/settings-utils";
import { fileToUploadPayload, isValidPhoneNumberInput } from "@/shared/utils";
import type { CompanySettings } from "@/features/settings/types/settings";

export function CompanySettingsPage() {
  const { user } = useAuth();
  const { company, branding, updateCompany, updateBranding, loading, saving } =
    useAppConfig();
  const [draft, setDraft] = useState<CompanySettings | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [driveStatus, setDriveStatus] = useState<GoogleDriveStatusDto | null>(null);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const form = draft ?? company;
  const isPhoneValid = isValidPhoneNumberInput(form.phone);
  const logoUrl = branding.logoUrl;
  const isSuperAdmin = user?.role === "super_admin";

  const updateField = <K extends keyof CompanySettings>(
    field: K,
    value: CompanySettings[K]
  ) => {
    setDraft((prev) => ({ ...(prev ?? company), [field]: value }));
  };

  const handleSave = async () => {
    await updateCompany(form);
    setDraft(null);
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file) return;
    setLogoUploading(true);
    setLogoError(null);
    try {
      const payload = await fileToUploadPayload(file);
      const uploaded = await uploadsApi.upload({ ...payload, makePublic: true });
      await updateBranding({ ...branding, logoUrl: uploaded.url });
      if (logoInputRef.current) logoInputRef.current.value = "";
    } catch (err) {
      setLogoError(getErrorMessage(err));
    } finally {
      setLogoUploading(false);
    }
  };

  const loadDriveStatus = useCallback(async () => {
    if (!isSuperAdmin) return;
    setDriveLoading(true);
    setDriveError(null);
    try {
      setDriveStatus(await googleDriveApi.status());
    } catch (err) {
      setDriveError(getErrorMessage(err));
      setDriveStatus(null);
    } finally {
      setDriveLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    void loadDriveStatus();
  }, [loadDriveStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("driveConnected") === "1") {
      void loadDriveStatus();
      params.delete("driveConnected");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
    }
  }, [loadDriveStatus]);

  const handleConnectDrive = async () => {
    setDriveError(null);
    setDriveLoading(true);
    try {
      const result = await googleDriveApi.connect();
      if (result.alreadyConnected) {
        setDriveStatus(result.status);
        return;
      }
      if (!result.authorizationUrl) {
        throw new Error("Google authorization URL was not returned by the server.");
      }
      window.location.href = result.authorizationUrl;
    } catch (err) {
      setDriveError(getErrorMessage(err));
      setDriveLoading(false);
    }
  };
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading company settings...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Company</h2>
        <p className="text-sm text-muted-foreground">
          Your organization profile and legal identifiers.
        </p>
      </div>

      {isSuperAdmin && (
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Google Drive Connection</h3>
              <p className="text-sm text-muted-foreground">
                One-time admin connection for all CRM attachment uploads.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={driveLoading}
              onClick={() => void handleConnectDrive()}
            >
              {driveStatus?.connected ? "Reconnect" : "Connect Google Drive"}
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="mt-1 text-sm font-medium">
                {driveLoading
                  ? "Checking..."
                  : driveStatus?.connected
                    ? "Connected"
                    : driveStatus?.oauthConfigured === false
                      ? "OAuth not configured"
                      : "Not connected"}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Connected Gmail</p>
              <p className="mt-1 text-sm font-medium">{driveStatus?.email || "—"}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Drive Folder</p>
              <p className="mt-1 text-sm font-medium">
                {driveStatus?.folderName || driveStatus?.folderId || "—"}
              </p>
            </div>
          </div>

          {driveError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {driveError}
            </p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Company Logo</Label>
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 sm:flex-row sm:items-center">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                {logoUrl ? (
                  <img src={logoUrl} alt="Company logo" className="size-full object-contain" />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium">
                  {logoUrl ? "Logo uploaded" : "Upload company logo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, or SVG recommended. Max 6 MB. Saved to branding settings.
                </p>
                <Input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="rounded-xl"
                  disabled={logoUploading || saving}
                  onChange={(e) => void handleLogoUpload(e.target.files?.[0] ?? null)}
                />
                {logoError && (
                  <p role="alert" className="text-xs text-destructive">
                    {logoError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN</Label>
            <Input
              id="gstin"
              value={form.gstin}
              onChange={(e) => updateField("gstin", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pan">PAN</Label>
            <Input
              id="pan"
              value={form.pan}
              onChange={(e) => updateField("pan", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <PhoneNumberInput
              id="phone"
              value={form.phone}
              onChange={(value) => updateField("phone", value)}
              ariaInvalid={!isPhoneValid}
              ariaDescribedBy={!isPhoneValid ? "company-phone-error" : undefined}
            />
            {!isPhoneValid && (
              <p id="company-phone-error" className="text-xs text-destructive">
                Please enter a valid mobile number.
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className="min-h-24 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(value) => updateField("currency", value)}
            >
              <SelectTrigger id="currency" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="financial-year">Financial Year</Label>
            <Select
              value={form.financialYear}
              onValueChange={(value) => updateField("financialYear", value)}
            >
              <SelectTrigger id="financial-year" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {financialYearOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-6">
          <Button
            className="rounded-xl"
            onClick={() => void handleSave()}
            disabled={saving || logoUploading || !isPhoneValid}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
