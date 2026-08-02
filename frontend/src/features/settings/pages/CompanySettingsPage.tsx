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
import { isValidGstin, isValidPan } from "@/features/settings/utils/app-config-utils";
import { currencyOptions, financialYearOptions } from "@/features/settings/utils/settings-utils";
import { CompanyLogoImage } from "@/shared/components/CompanyLogoImage";
import { fileToUploadPayload, isValidPhoneNumberInput } from "@/shared/utils";
import type { CompanySettings } from "@/features/settings/types/settings";

export function CompanySettingsPage() {
  const { user } = useAuth();
  const { company, branding, updateCompany, updateBranding, loading, saving } =
    useAppConfig();
  const [draft, setDraft] = useState<CompanySettings | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    companyName?: string;
    gstin?: string;
    pan?: string;
  }>({});
  const [driveStatus, setDriveStatus] = useState<GoogleDriveStatusDto | null>(null);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const form = draft ?? company;
  const isPhoneValid = isValidPhoneNumberInput(form.phone);
  const hasStoredLogo = Boolean(branding.logoUrl?.trim());
  const isSuperAdmin = user?.role === "super_admin";

  const updateField = <K extends keyof CompanySettings>(
    field: K,
    value: CompanySettings[K]
  ) => {
    setDraft((prev) => ({ ...(prev ?? company), [field]: value }));
    if (field === "companyName" || field === "gstin" || field === "pan") {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: typeof fieldErrors = {};
    if (!form.companyName.trim()) {
      nextErrors.companyName = "Company name is required.";
    }
    if (!isValidGstin(form.gstin)) {
      nextErrors.gstin = "Invalid GSTIN format. Expected: 22AAAAA0000A1Z5";
    }
    if (!isValidPan(form.pan)) {
      nextErrors.pan = "Invalid PAN format. Expected: ABCDE1234F";
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    const payload: CompanySettings = {
      ...form,
      companyName: form.companyName.trim(),
      gstin: form.gstin.trim().toUpperCase(),
      pan: form.pan.trim().toUpperCase(),
    };
    await updateCompany(payload);
    setDraft(null);
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file) return;
    setLogoUploading(true);
    setLogoError(null);
    const objectUrl = URL.createObjectURL(file);
    setLocalLogoPreview(objectUrl);
    try {
      const payload = await fileToUploadPayload(file);
      const uploaded = await uploadsApi.upload({ ...payload, makePublic: true });
      await updateBranding({ ...branding, logoUrl: uploaded.url });
      if (logoInputRef.current) logoInputRef.current.value = "";
      // Keep local preview briefly until branding state settles, then clear.
      setLocalLogoPreview(null);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setLogoError(getErrorMessage(err));
      setLocalLogoPreview(null);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setLogoError(null);
    setLocalLogoPreview(null);
    try {
      await updateBranding({ ...branding, logoUrl: "" });
      if (logoInputRef.current) logoInputRef.current.value = "";
    } catch (err) {
      setLogoError(getErrorMessage(err));
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

  const handleConnectDrive = async (force = false) => {
    setDriveError(null);
    setDriveLoading(true);
    try {
      const result = await googleDriveApi.connect({ force });
      if (result.alreadyConnected && !force) {
        setDriveStatus(result.status);
        setDriveLoading(false);
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

  const handleDisconnectDrive = async () => {
    const confirmed = window.confirm(
      "Disconnect Google Drive?\n\nUploads will stop working until a Super Admin reconnects."
    );
    if (!confirmed) return;

    setDriveError(null);
    setDriveLoading(true);
    try {
      const status = await googleDriveApi.disconnect();
      setDriveStatus(status);
    } catch (err) {
      setDriveError(getErrorMessage(err));
    } finally {
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
                Connect once as Super Admin. The connection is stored securely and stays
                active across Render restarts until you disconnect it.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {driveStatus?.connected ? (
                <>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={driveLoading}
                    onClick={() => void handleConnectDrive(true)}
                  >
                    Reconnect
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl text-destructive hover:text-destructive"
                    disabled={driveLoading}
                    onClick={() => void handleDisconnectDrive()}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={driveLoading || driveStatus?.oauthConfigured === false}
                  onClick={() => void handleConnectDrive(false)}
                >
                  Connect Google Drive
                </Button>
              )}
            </div>
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
            <Label htmlFor="company-name">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-name"
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              className="rounded-xl"
              aria-invalid={Boolean(fieldErrors.companyName)}
              aria-describedby={fieldErrors.companyName ? "company-name-error" : undefined}
            />
            <p className="text-xs text-muted-foreground">Mandatory</p>
            {fieldErrors.companyName && (
              <p id="company-name-error" className="text-xs text-destructive">
                {fieldErrors.companyName}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Company Logo</Label>
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 sm:flex-row sm:items-center">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-background p-2 shadow-sm ring-1 ring-border/60">
                {localLogoPreview ? (
                  <img
                    src={localLogoPreview}
                    alt="Company logo preview"
                    className="size-full object-contain"
                  />
                ) : hasStoredLogo ? (
                  <CompanyLogoImage
                    logoUrl={branding.logoUrl}
                    alt="Company logo preview"
                    className="size-full"
                  />
                ) : (
                  <ImageIcon className="size-7 text-muted-foreground" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium">
                  {hasStoredLogo || localLogoPreview ? "Logo preview" : "No logo uploaded"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, or SVG recommended. Max 6 MB. Shown in the sidebar and header.
                </p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  disabled={logoUploading || saving}
                  onChange={(e) => void handleLogoUpload(e.target.files?.[0] ?? null)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    disabled={logoUploading || saving}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {logoUploading
                      ? "Uploading..."
                      : hasStoredLogo
                        ? "Replace Logo"
                        : "Upload Logo"}
                  </Button>
                  {hasStoredLogo && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl text-destructive hover:text-destructive"
                      disabled={logoUploading || saving}
                      onClick={() => void handleRemoveLogo()}
                    >
                      Remove Logo
                    </Button>
                  )}
                </div>
                {logoError && (
                  <p role="alert" className="text-xs text-destructive">
                    {logoError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">
              GSTIN <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="gstin"
              value={form.gstin}
              onChange={(e) => updateField("gstin", e.target.value.toUpperCase())}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
              className="rounded-xl"
              aria-invalid={Boolean(fieldErrors.gstin)}
              aria-describedby={fieldErrors.gstin ? "gstin-error" : "gstin-hint"}
            />
            <p id="gstin-hint" className="text-xs text-muted-foreground">
              Format: 22AAAAA0000A1Z5
            </p>
            {fieldErrors.gstin && (
              <p id="gstin-error" className="text-xs text-destructive">
                {fieldErrors.gstin}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pan">
              PAN <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="pan"
              value={form.pan}
              onChange={(e) => updateField("pan", e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
              className="rounded-xl"
              aria-invalid={Boolean(fieldErrors.pan)}
              aria-describedby={fieldErrors.pan ? "pan-error" : "pan-hint"}
            />
            <p id="pan-hint" className="text-xs text-muted-foreground">
              Format: ABCDE1234F
            </p>
            {fieldErrors.pan && (
              <p id="pan-error" className="text-xs text-destructive">
                {fieldErrors.pan}
              </p>
            )}
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
