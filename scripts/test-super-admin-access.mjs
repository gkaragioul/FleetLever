import assert from "node:assert/strict";
import test from "node:test";

import {
  allowsLocalDevelopmentAccess,
  decodeSession,
  encodeSession,
  isHostedDeployment,
  sessionSecret,
} from "../src/lib/auth/super-admin-core.mjs";

const secret = "a-test-session-secret-that-is-long-enough";

function session(overrides = {}) {
  return { role: "super_admin", username: "tester", expiresAt: Date.now() + 60_000, ...overrides };
}

test("a hosted deployment is recognised from any supported platform variable", () => {
  assert.equal(isHostedDeployment({}), false);
  assert.equal(isHostedDeployment({ RAILWAY_ENVIRONMENT: "production" }), true);
  assert.equal(isHostedDeployment({ VERCEL: "1" }), true);
  assert.equal(isHostedDeployment({ RENDER: "true" }), true);
  assert.equal(isHostedDeployment({ FLY_APP_NAME: "fleetlever" }), true);
});

test("local development access is allowed only off-platform", () => {
  assert.equal(allowsLocalDevelopmentAccess({ NODE_ENV: "development" }), true);
  assert.equal(allowsLocalDevelopmentAccess({ NODE_ENV: "test" }), true);
  assert.equal(allowsLocalDevelopmentAccess({}), true);
});

test("local development access is refused in production", () => {
  assert.equal(allowsLocalDevelopmentAccess({ NODE_ENV: "production" }), false);
});

test("a signed session round-trips", () => {
  const original = session();
  const decoded = decodeSession(encodeSession(original, secret), secret);

  assert.deepEqual(decoded, original);
});

test("a session signed with a different secret is rejected", () => {
  const cookie = encodeSession(session(), secret);

  assert.equal(decodeSession(cookie, "a-different-secret-that-is-long-enough"), null);
});

test("a tampered payload is rejected", () => {
  const [, signature] = encodeSession(session(), secret).split(".");
  const forged = Buffer.from(JSON.stringify(session({ username: "attacker" }))).toString("base64url");

  assert.equal(decodeSession(`${forged}.${signature}`, secret), null);
});

test("an expired session is rejected", () => {
  const cookie = encodeSession(session({ expiresAt: Date.now() - 1 }), secret);

  assert.equal(decodeSession(cookie, secret), null);
});

test("malformed cookie values are rejected rather than thrown on", () => {
  for (const value of ["", "no-separator", "a.b", "...", "%%%.%%%"]) {
    assert.equal(decodeSession(value, secret), null, `expected ${JSON.stringify(value)} to be rejected`);
  }
});

test("a session that is not a super admin is rejected", () => {
  const cookie = encodeSession(session({ role: "viewer" }), secret);

  assert.equal(decodeSession(cookie, secret), null);
});

test("a hosted deployment demands a real session secret", () => {
  assert.throws(() => sessionSecret({ RAILWAY_ENVIRONMENT: "production" }));
  assert.throws(() => sessionSecret({ RAILWAY_ENVIRONMENT: "production", FLEETLEVER_SESSION_SECRET: "too-short" }));
  assert.equal(sessionSecret({ RAILWAY_ENVIRONMENT: "production", FLEETLEVER_SESSION_SECRET: secret }), secret);
});

test("local runs fall back to a development session secret", () => {
  assert.equal(typeof sessionSecret({}), "string");
  assert.ok(sessionSecret({}).length >= 32);
});

test("a hosted deployment never grants local development access", () => {
  // The dangerous case: a hosted app started with `npm run dev`, or with NODE_ENV unset,
  // must not hand out a super admin session just because it is not in production mode.
  assert.equal(allowsLocalDevelopmentAccess({ NODE_ENV: "development", RAILWAY_ENVIRONMENT: "production" }), false);
  assert.equal(allowsLocalDevelopmentAccess({ RAILWAY_ENVIRONMENT: "production" }), false);
  assert.equal(allowsLocalDevelopmentAccess({ NODE_ENV: "development", VERCEL: "1" }), false);
  assert.equal(allowsLocalDevelopmentAccess({ NODE_ENV: "development", RENDER: "true" }), false);
  assert.equal(allowsLocalDevelopmentAccess({ NODE_ENV: "development", FLY_APP_NAME: "fleetlever" }), false);
});
