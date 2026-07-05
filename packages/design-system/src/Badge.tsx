import type { HTMLAttributes, ReactNode } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** coral / flame = accent tags, muted = metadata, cream = high-contrast label */
  tone?: "coral" | "flame" | "muted" | "cream";
  children: ReactNode;
}

export function Badge({ tone = "coral", className, children, ...rest }: BadgeProps) {
  const cls = ["ft-badge", `ft-badge--${tone}`, className ?? ""].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}
