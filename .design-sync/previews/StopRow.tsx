import { StopRow } from "@funtog/design-system";

const Frame = ({ children }: { children?: any }) => (
  <div className="ft-root" style={{ padding: 20, borderRadius: 12, display: "grid", gap: 8, minWidth: 300 }}>
    {children}
  </div>
);

export const Single = () => (
  <Frame>
    <StopRow time="20:00" what="The Midnight Kitchen" tags={["$$", "veg"]} />
  </Frame>
);

export const NightSequence = () => (
  <Frame>
    <StopRow time="20:00" what="The Midnight Kitchen" tags={["$$", "veg"]} />
    <StopRow time="21:30" what="The Golden Bar" tags={["$$", "walkable"]} />
    <StopRow time="23:00" what="The Crimson Club" />
  </Frame>
);
