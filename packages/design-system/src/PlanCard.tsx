import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";
import { StopRow, type StopRowProps } from "./StopRow";

export interface PlanCardProps {
  /** the night's arc, e.g. "small plates → lively bar → late-night sweet" */
  arc: string;
  stops: StopRowProps[];
  selected?: boolean;
  /** e.g. "grounded" | "shapes" — shown as a badge when set */
  mode?: string;
  onSelect?: () => void;
  /** CTA label; omit to hide the button */
  actionLabel?: string;
}

export function PlanCard({ arc, stops, selected, mode, onSelect, actionLabel }: PlanCardProps) {
  return (
    <Card
      className="ft-plan-card"
      title={arc}
      interactive={Boolean(onSelect)}
      selected={selected}
      onClick={onSelect}
      footer={
        actionLabel || mode ? (
          <>
            {actionLabel && (
              <Button variant={selected ? "flame" : "outline"} size="sm" onClick={onSelect}>
                {actionLabel}
              </Button>
            )}
            {mode && <Badge tone="muted">{mode}</Badge>}
          </>
        ) : undefined
      }
    >
      <div className="ft-plan-card__stops">
        {stops.map((s, i) => (
          <StopRow key={i} {...s} />
        ))}
      </div>
    </Card>
  );
}
