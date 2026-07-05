import { PlanCard } from "@funtog/design-system";

const Frame = ({ children }: { children?: any }) => (
  <div className="ft-root" style={{ padding: 20, borderRadius: 12, display: "grid", gap: 16, minWidth: 320 }}>
    {children}
  </div>
);

const stops = [
  { time: "20:00", what: "The Midnight Kitchen", tags: ["$$", "veg"] },
  { time: "21:30", what: "The Golden Bar", tags: ["$$"] },
  { time: "23:00", what: "The Crimson Club" },
];

export const GroundedSelected = () => (
  <Frame>
    <PlanCard
      arc="small plates → lively bar → late-night sweet"
      stops={stops}
      mode="grounded"
      actionLabel="Lock it in"
      selected
    />
  </Frame>
);

export const ShapesChoice = () => (
  <Frame>
    <PlanCard
      arc="straight to the main event"
      stops={[
        { time: "21:00", what: "a lively natural-wine bar", tags: ["$$"] },
        { time: "23:00", what: "late-night dessert window" },
      ]}
      mode="shapes"
      actionLabel="Pick this"
      onSelect={() => {}}
    />
  </Frame>
);
