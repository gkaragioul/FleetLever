import assert from "node:assert/strict";
import test from "node:test";

import {
  createPasswordHash,
  hashOpaqueToken,
  normalizeEmail,
  safeRedirectPath,
  trialAccessState,
  verifyPassword,
} from "../src/lib/auth/account-core.mjs";

test("password hashes are salted and verifiable", () => {
  const first = createPasswordHash("Correct horse battery staple 42!");
  const second = createPasswordHash("Correct horse battery staple 42!");
  assert.notEqual(first, second);
  assert.equal(verifyPassword("Correct horse battery staple 42!", first), true);
  assert.equal(verifyPassword("wrong password", first), false);
});

test("identity input is normalized conservatively", () => {
  assert.equal(normalizeEmail("  George@Example.COM "), "george@example.com");
  assert.equal(safeRedirectPath("/fleet-management?view=machines"), "/fleet-management?view=machines");
  assert.equal(safeRedirectPath("//attacker.example"), "/fleet-management");
  assert.equal(safeRedirectPath("https://attacker.example"), "/fleet-management");
});

test("opaque tokens are stored only as one-way hashes", () => {
  assert.match(hashOpaqueToken("secret-token"), /^[a-f0-9]{64}$/);
  assert.notEqual(hashOpaqueToken("secret-token"), "secret-token");
});

test("trial dates are immutable server-side access inputs", () => {
  const now = Date.parse("2026-07-16T12:00:00.000Z");
  assert.deepEqual(trialAccessState("2026-07-01T12:00:00.000Z", "2026-07-17T12:00:00.000Z", now), {
    active: true,
    daysRemaining: 1,
    expired: false,
  });
  assert.deepEqual(trialAccessState("2026-06-01T12:00:00.000Z", "2026-07-15T12:00:00.000Z", now), {
    active: false,
    daysRemaining: 0,
    expired: true,
  });
});

test("a newly created trial tolerates bounded database and application clock skew", () => {
  const applicationNow = Date.parse("2026-07-17T12:00:00.000Z");
  assert.deepEqual(
    trialAccessState("2026-07-17T12:00:30.000Z", "2026-08-01T12:00:30.000Z", applicationNow),
    { active: true, daysRemaining: 15, expired: false },
  );
});
