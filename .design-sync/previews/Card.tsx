import { Badge, Button, Card } from "@funtog/design-system";

const Frame = ({ children }: { children?: any }) => (
  <div className="ft-root" style={{ padding: 20, borderRadius: 12, display: "grid", gap: 16 }}>
    {children}
  </div>
);

export const Basic = () => (
  <Frame>
    <Card title="Tonight's headline">
      Camden is buzzing after 9 — three plans are ready for the crew to vote on.
    </Card>
  </Frame>
);

export const WithFooter = () => (
  <Frame>
    <Card
      title="Crew check-in"
      footer={
        <>
          <Button size="sm" variant="outline">Nudge the crew</Button>
          <Badge tone="muted">2 of 5 voted</Badge>
        </>
      }
    >
      Maya and Jordan are in. Waiting on three more votes before the wheel spins.
    </Card>
  </Frame>
);

export const SelectedInteractive = () => (
  <Frame>
    <Card title="Rooftop first, then tacos" interactive selected>
      The crew favourite so far — 4 votes.
    </Card>
    <Card title="Straight to the main event" interactive>
      One vote. Somebody really wants karaoke.
    </Card>
  </Frame>
);
