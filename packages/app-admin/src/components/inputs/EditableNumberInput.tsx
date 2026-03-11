import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface EditableNumberInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  readOnly?: boolean;
}

export function EditableNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
  readOnly,
  ...props
}: EditableNumberInputProps) {
  const [raw, setRaw] = React.useState(String(value));

  React.useEffect(() => {
    setRaw(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = e.target.value;
    setRaw(s);
    const n = parseFloat(s);
    if (!Number.isNaN(n)) {
      let v = n;
      if (min != null) v = Math.max(min, v);
      if (max != null) v = Math.min(max, v);
      onChange(v);
    }
  };

  const handleBlur = () => {
    setRaw(String(value));
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={props.id != null ? props.id : undefined} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={handleChange}
        onBlur={handleBlur}
        readOnly={readOnly}
        disabled={readOnly}
        className={cn(readOnly && "bg-muted cursor-default")}
      />
    </div>
  );
}
