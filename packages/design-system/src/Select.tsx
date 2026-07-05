import type { SelectHTMLAttributes } from "react";
import { useId } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
}

export function Select({ label, hint, error, options, className, id, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const cls = ["ft-field", error ? "ft-field--error" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      {label && <label className="ft-field__label" htmlFor={selectId}>{label}</label>}
      <select id={selectId} className="ft-field__control" {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {(error || hint) && (
        <span className={error ? "ft-field__hint ft-field__hint--error" : "ft-field__hint"}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
