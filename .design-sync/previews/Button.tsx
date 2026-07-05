import { Button } from "@funtog/design-system";

const Frame = ({ children }: { children?: any }) => (
  <div className="ft-root" style={{ padding: 20, borderRadius: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
    {children}
  </div>
);

export const Variants = () => (
  <Frame>
    <Button variant="flame">Plan my night</Button>
    <Button variant="coral">Vote</Button>
    <Button variant="outline">Refine</Button>
    <Button variant="ghost">Skip</Button>
  </Frame>
);

export const Sizes = () => (
  <Frame>
    <Button size="sm">Lock it in</Button>
    <Button size="md">Lock it in</Button>
    <Button size="lg">Lock it in</Button>
  </Frame>
);

export const States = () => (
  <Frame>
    <Button disabled>Counting votes…</Button>
    <Button variant="coral" fullWidth>Start the night</Button>
  </Frame>
);
