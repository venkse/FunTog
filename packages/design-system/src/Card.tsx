import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  footer?: ReactNode;
  /** hover affordance for clickable cards */
  interactive?: boolean;
  /** coral highlight ring, e.g. the chosen plan */
  selected?: boolean;
  children: ReactNode;
}

export function Card({ title, footer, interactive, selected, className, children, ...rest }: CardProps) {
  const cls = [
    "ft-card",
    interactive ? "ft-card--interactive" : "",
    selected ? "ft-card--selected" : "",
    className ?? "",
  ].filter(Boolean).join(" ");
  return (
    <article className={cls} {...rest}>
      {title != null && <h3 className="ft-card__title">{title}</h3>}
      <div className="ft-card__body">{children}</div>
      {footer != null && <div className="ft-card__footer">{footer}</div>}
    </article>
  );
}
