import { createHmac, timingSafeEqual } from "node:crypto";

// Signed, STATELESS join tokens. Validation is an HMAC compare — O(1), no store/DB round-trip — so a
// viral link (join storm) never touches a hot partition to verify. The crew owns this scheme.
//
// KEY ROTATION: tokens carry a key id (`kid`) so the secret can rotate WITHOUT killing every live
// crew link. Verification looks the kid up in a keyring; old tokens verify against the old key
// until they age out, new tokens sign with the current key. Legacy 2-part tokens (pre-kid) verify
// against the ring's designated legacy key, so nothing breaks on deploy.

export interface JoinClaims { sid: string; cid: string; iat: number }

/** current: the kid new tokens are signed with. keys: every kid still accepted. legacy: the kid legacy 2-part tokens verify against. */
export interface Keyring { current: string; keys: Record<string, string>; legacy?: string }

/** A bare secret is the common case — wrap it as a single-key ring (kid "k1", also the legacy key). */
export function ringFromSecret(secret: string): Keyring {
  return { current: "k1", keys: { k1: secret }, legacy: "k1" };
}

const b64 = (b: Buffer): string => b.toString("base64url");
const sign = (payload: string, secret: string): string =>
  createHmac("sha256", secret).update(payload).digest("base64url");

export function issueJoinToken(
  claims: { sid: string; cid: string },
  secretOrRing: string | Keyring,
  now: () => number = Date.now,
): string {
  const ring = typeof secretOrRing === "string" ? ringFromSecret(secretOrRing) : secretOrRing;
  const key = ring.keys[ring.current];
  if (!key) throw new Error(`keyring has no secret for current kid '${ring.current}'`);
  const payload = b64(Buffer.from(JSON.stringify({ sid: claims.sid, cid: claims.cid, iat: now() })));
  return `${ring.current}.${payload}.${sign(`${ring.current}.${payload}`, key)}`;
}

/**
 * Returns claims if the signature is valid, else null. Stateless; the kid selects the key.
 * Accepts: 3-part `kid.payload.sig` (current) and 2-part `payload.sig` (legacy, pre-rotation).
 * An unknown kid → null (rotated-out keys stop verifying — that's the point of rotation).
 */
export function verifyJoinToken(token: string, secretOrRing: string | Keyring): JoinClaims | null {
  const ring = typeof secretOrRing === "string" ? ringFromSecret(secretOrRing) : secretOrRing;
  const parts = token.split(".");

  if (parts.length === 3) {
    const [kid, payload, sig] = parts;
    const key = ring.keys[kid];
    if (!key) return null;                                   // unknown / retired kid
    if (!safeEq(sig, sign(`${kid}.${payload}`, key))) return null;
    return decode(payload);
  }
  if (parts.length === 2) {                                  // legacy token from before kids existed
    const [payload, sig] = parts;
    const key = ring.legacy ? ring.keys[ring.legacy] : undefined;
    if (!key) return null;
    if (!safeEq(sig, sign(payload, key))) return null;
    return decode(payload);
  }
  return null;
}

function decode(payload: string): JoinClaims | null {
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()) as JoinClaims; }
  catch { return null; }
}

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
