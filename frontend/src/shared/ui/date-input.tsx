import { Calendar } from "lucide-react";
import { useEffect, useId, useState, type ComponentProps, type ChangeEvent } from "react";
import { cn } from "@/shared/utils";
import { displayDateToIso, isoToDisplayDate } from "@/shared/utils/format-date";
import { inputClassName } from "@/shared/ui/input-styles";

type DateInputProps = Omit<ComponentProps<"input">, "type">;

function emitChange(
  onChange: DateInputProps["onChange"],
  iso: string,
  name?: string,
  id?: string
) {
  onChange?.({
    target: { value: iso, name: name ?? "", id: id ?? "" },
    currentTarget: { value: iso, name: name ?? "", id: id ?? "" },
  } as ChangeEvent<HTMLInputElement>);
}

export function DateInput({
  className,
  value,
  defaultValue,
  onChange,
  onBlur,
  disabled,
  readOnly,
  id,
  name,
  required,
  min,
  max,
  ...props
}: DateInputProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const isoValue = String(value ?? defaultValue ?? "");
  const [text, setText] = useState(() => isoToDisplayDate(isoValue));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(isoToDisplayDate(isoValue));
    setInvalid(false);
  }, [isoValue]);

  const commit = (nextText: string, blur = false) => {
    const iso = displayDateToIso(nextText);
    if (iso === null) {
      setInvalid(Boolean(nextText.trim()));
      return;
    }
    setInvalid(false);
    if (blur) setText(iso ? isoToDisplayDate(iso) : "");
    emitChange(onChange, iso, name, fieldId);
  };

  return (
    <div className="relative">
      <input
        {...props}
        id={fieldId}
        name={name}
        type="text"
        inputMode="text"
        autoComplete="off"
        placeholder="DD/MM/YYYY"
        value={text}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || props["aria-invalid"]}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const iso = displayDateToIso(next);
          if (iso === null) {
            setInvalid(Boolean(next.trim()));
            return;
          }
          setInvalid(false);
          emitChange(onChange, iso, name, fieldId);
        }}
        onBlur={(event) => {
          commit(text, true);
          onBlur?.(event);
        }}
        className={cn(inputClassName, "pr-10", className)}
      />
      {!readOnly && !disabled && (
        <>
          <Calendar
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="date"
            tabIndex={-1}
            aria-label="Open calendar"
            value={/^\d{4}-\d{2}-\d{2}$/.test(isoValue) ? isoValue : ""}
            min={typeof min === "string" ? min : undefined}
            max={typeof max === "string" ? max : undefined}
            disabled={disabled}
            onChange={(event) => {
              const iso = event.target.value;
              setText(isoToDisplayDate(iso));
              setInvalid(false);
              emitChange(onChange, iso, name, fieldId);
            }}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 cursor-pointer opacity-0"
          />
        </>
      )}
    </div>
  );
}
