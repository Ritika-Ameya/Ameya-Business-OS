import PhoneInput from "react-phone-number-input";
import type { E164Number } from "libphonenumber-js/core";
import { cn } from "@/shared/utils";

type PhoneNumberInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  className?: string;
};

export function PhoneNumberInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  ariaInvalid,
  ariaDescribedBy,
  className,
}: PhoneNumberInputProps) {
  return (
    <PhoneInput
      id={id}
      international
      countryCallingCodeEditable={false}
      defaultCountry="IN"
      value={(value || undefined) as E164Number | undefined}
      onChange={(next) => onChange(next ?? "")}
      placeholder={placeholder ?? "Enter phone number"}
      disabled={disabled}
      required={required}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-xl border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "[&_.PhoneInputCountry]:shrink-0 [&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:text-sm",
        "[&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-muted-foreground",
        className,
      )}
    />
  );
}
