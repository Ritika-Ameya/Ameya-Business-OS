import { Calendar } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ChangeEvent,
} from "react";
import { cn } from "@/shared/utils";
import {
  dateInputPlaceholder,
  displayDateToIso,
  isoToDisplayDate,
} from "@/shared/utils/format-date";
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
  const pickerRef = useRef<HTMLInputElement>(null);
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

  const openPicker = () => {
    const input = pickerRef.current;
    if (!input || disabled || readOnly) return;
    try {
      input.showPicker?.();
    } catch {
      input.click();
    }
  };

  return (
    <div className="relative w-full min-w-0 overflow-visible">
      <input
        {...props}
        id={fieldId}
        name={name}
        type="text"
        inputMode="text"
        autoComplete="off"
        placeholder={dateInputPlaceholder()}
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
        className={cn(inputClassName, "min-w-0 pr-11", className)}
      />
      {!readOnly && !disabled ? (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Open calendar"
            className="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground hover:text-foreground"
            onClick={openPicker}
          >
            <Calendar className="size-4" aria-hidden />
          </button>
          {/*
            Keep the native date input out of the visible layout. Safari clips
            overlaid opacity-0 date controls inside overflow drawers; showPicker
            from a button avoids that cut-off.
          */}
          <input
            ref={pickerRef}
            type="date"
            tabIndex={-1}
            aria-hidden
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
            className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
          />
        </>
      ) : null}
    </div>
  );
}
