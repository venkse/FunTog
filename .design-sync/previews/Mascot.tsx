import { Mascot } from "@funtog/design-system";

const Frame = ({ children }: { children?: any }) => (
  <div className="ft-root" style={{ padding: 20, borderRadius: 12, display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
    {children}
  </div>
);

const Labelled = ({ mood }: { mood: any }) => (
  <figure style={{ margin: 0, textAlign: "center" }}>
    <Mascot mood={mood} size={96} />
    <figcaption style={{ fontSize: 12, color: "var(--ft-muted)" }}>{mood}</figcaption>
  </figure>
);

export const Planning = () => (
  <Frame>
    <Labelled mood="idle" />
    <Labelled mood="plotting" />
    <Labelled mood="thinking" />
    <Labelled mood="mischief" />
  </Frame>
);

export const Celebrating = () => (
  <Frame>
    <Labelled mood="smug" />
    <Labelled mood="wink" />
    <Labelled mood="tada" />
    <Labelled mood="cheer" />
  </Frame>
);
