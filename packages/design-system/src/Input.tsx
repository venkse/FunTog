import type { InputHTMLAttributes } from "react";
import { useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  /** shown instead of hint, turns the border red */
  error?: string;
}

export function Input({ label, hint, error, className, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const cls = ["ft-field", error ? "ft-field--error" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      {label && <label className="ft-field__label" htmlFor={inputId}>{label}</label>}
      <input id={inputId} className="ft-field__control" {...rest} />
      {(error || hint) && (
        <span className={error ? "ft-field__hint ft-field__hint--error" : "ft-field__hint"}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
