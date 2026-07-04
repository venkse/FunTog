import { test } from "node:test";
import assert from "node:assert/strict";
import { issueJoinToken, verifyJoinToken, ringFromSecret, type Keyring } from "../src/tokens";
import { createCrew } from "../src/index";

test("tokens carry a kid and verify via the keyring", () => {
  const ring: Keyring = { current: "k2", keys: { k1: "old-secret", k2: "new-secret" }, legacy: "k1" };
  const t = issueJoinToken({ sid: "s9", cid: "c9" }, ring);
  assert.equal(t.split(".").length, 3);
  assert.ok(t.startsWith("k2."));
  assert.equal(verifyJoinToken(t, ring)?.sid, "s9");
});

test("rotation: old-kid tokens keep working until the key is retired", () => {
  const before: Keyring = { current: "k1", keys: { k1: "old-secret" } };
  const oldToken = issueJoinToken({ sid: "s1", cid: "c1" }, before);
  // rotate: k2 becomes current, k1 still accepted
  const during: Keyring = { current: "k2", keys: { k1: "old-secret", k2: "new-secret" } };
  assert.equal(verifyJoinToken(oldToken, during)?.sid, "s1", "old token verifies mid-rotation");
  // retire k1 entirely → old tokens die, new ones live
  const after: Keyring = { current: "k2", keys: { k2: "new-secret" } };
  assert.equal(verifyJoinToken(oldToken, after), null, "retired kid stops verifying");
  const newToken = issueJoinToken({ sid: "s2", cid: "c2" }, after);
  assert.equal(verifyJoinToken(newToken, after)?.sid, "s2");
});

test("legacy 2-part tokens (pre-kid) verify against the ring's legacy key", () => {
  // hand-build a legacy token the way the old code did: payload.sig with bare secret
  const legacyRing = ringFromSecret("funtog-dev-secret");
  const modern = issueJoinToken({ sid: "sL", cid: "cL" }, legacyRing);
  const [, payload, sig] = modern.split(".");
  // recreate old format by re-signing payload without kid prefix using same secret
  const { createHmac } = require("node:crypto");
  const oldSig = createHmac("sha256", "funtog-dev-secret").update(payload).digest("base64url");
  const legacyToken = `${payload}.${oldSig}`;
  assert.equal(verifyJoinToken(legacyToken, legacyRing)?.sid, "sL");
  void sig;
});

test("crew service accepts a keyring and cross-key tampering fails", async () => {
  const ring: Keyring = { current: "k2", keys: { k1: "a", k2: "b" }, legacy: "k1" };
  const crew = createCrew({ keyring: ring });
  const tok = crew.issueJoinToken("sess1", "crew1");
  assert.equal((await crew.joinByLink(tok)).sessionId, "sess1");
  // swap the kid to another valid kid → signature must fail (kid is signed-over)
  const forged = "k1." + tok.split(".").slice(1).join(".");
  await assert.rejects(() => crew.joinByLink(forged), /invalid|tampered/i);
});
