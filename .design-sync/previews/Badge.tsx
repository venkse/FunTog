import { Badge } from "@funtog/design-system";

const Frame = ({ children }: { children?: any }) => (
  <div className="ft-root" style={{ padding: 20, borderRadius: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
    {children}
  </div>
);

export const Tones = () => (
  <Frame>
    <Badge tone="coral">veg friendly</Badge>
    <Badge tone="flame">trending</Badge>
    <Badge tone="muted">grounded</Badge>
    <Badge tone="cream">tonight</Badge>
  </Frame>
);

export const InContext = () => (
  <Frame>
    <span style={{ fontWeight: 600 }}>The Golden Bar</span>
    <Badge tone="flame">walkable</Badge>
    <Badge tone="muted">$$</Badge>
  </Frame>
);
