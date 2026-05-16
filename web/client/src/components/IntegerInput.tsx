import { useEffect, useState } from "react";

type IntegerInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  id?: string;
  placeholder?: string;
};

function clamp(n: number, min?: number, max?: number): number {
  let result = n;
  if (min != null) result = Math.max(min, result);
  if (max != null) result = Math.min(max, result);
  return result;
}

function formatDisplayValue(value: number): string {
  return value === 0 ? "" : String(value);
}

export default function IntegerInput({
  value,
  onChange,
  min = 0,
  max,
  className,
  id,
  placeholder,
}: IntegerInputProps) {
  const [text, setText] = useState(() => formatDisplayValue(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;
    setText(formatDisplayValue(value));
  }, [value, focused]);

  const commitText = (raw: string) => {
    if (raw === "") {
      setText("");
      onChange(0);
      return;
    }
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    const clamped = clamp(n, min, max);
    setText(String(clamped));
    onChange(clamped);
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      className={className}
      placeholder={placeholder}
      value={text}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, "");
        setText(raw);
        if (raw !== "") {
          const n = parseInt(raw, 10);
          if (!Number.isNaN(n)) {
            onChange(clamp(n, min, max));
          }
        }
      }}
      onBlur={() => {
        setFocused(false);
        commitText(text);
      }}
    />
  );
}
