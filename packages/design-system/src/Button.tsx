import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** flame = primary CTA (gradient), coral = solid accent, outline / ghost = secondary */
  variant?: "flame" | "coral" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({ variant = "flame", size = "md", fullWidth, className, children, ...rest }: ButtonProps) {
  const cls = [
    "ft-button",
    `ft-button--${variant}`,
    `ft-button--${size}`,
    fullWidth ? "ft-button--full" : "",
    className ?? "",
  ].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
