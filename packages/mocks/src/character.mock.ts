import type { CharacterService, VoicePacket } from "@funtog/contracts";

export const mockCharacter: CharacterService = {
  async render(_crewId, plans): Promise<VoicePacket> {
    return { intro: "Alright, three flavours of trouble:", mood: "plotting", plans: plans.map((p) => ({
      planId: p.id, name: "The Slow Burn", tagline: "starts mellow, ends mischievous",
      pitch: "trust me on this one", mood: "mischief",
    }))};
  },
  async mediate(): Promise<VoicePacket> {
    return { read: "Three of you want the crawl; Sam's holding out.", mood: "thinking",
      advocacy: { for: "sam", line: "Sam's lost the last two — tonight we do his." } };
  },
  async setPersona() {},
  async setOverrides() {},
};
