import { Input } from "@funtog/design-system";

const Frame = ({ children }: { children?: any }) => (
  <div className="ft-root" style={{ padding: 20, borderRadius: 12, display: "grid", gap: 14, minWidth: 280 }}>
    {children}
  </div>
);

export const Default = () => (
  <Frame>
    <Input label="Vibe" placeholder="rooftop sunset drinks" hint="What's the energy tonight?" />
  </Frame>
);

export const Filled = () => (
  <Frame>
    <Input label="Area" defaultValue="shoreditch" />
  </Frame>
);

export const ErrorState = () => (
  <Frame>
    <Input label="Area" defaultValue="atlantis" error="We don't cover this area yet" />
  </Frame>
);
