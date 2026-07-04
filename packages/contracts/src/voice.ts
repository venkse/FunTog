// PRODUCED by Character. CONSUMED by Orchestrator -> clients.

/**
 * Standard mood vocabulary. The character emits a mood; the client maps each mood to a sprite
 * animation (the persona's sprite map is the server-side source of truth). Added in contracts 0.2.0.
 */
export type Mood =
  | "idle" | "plotting" | "tada" | "wink" | "thinking" | "mischief" | "smug" | "cheer";

export interface PlanVoice {
  planId: string;
  name: string;
  tagline: string;
  pitch: string;
  mood?: Mood;                 // which animation the sprite plays for this plan
  stopNotes?: Record<string, string>;
}

export interface VoicePacket {
  intro?: string;
  mood?: Mood;                 // overall mood for this beat
  plans?: PlanVoice[];         // from Render
  read?: string;               // from Mediate
  advocacy?: { for?: string; line: string } | null;
}
