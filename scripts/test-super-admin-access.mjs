import assert from "node:assert/strict";
import test from "node:test";

import { allowsLocalDevelopmentAccess, isHostedDeployment } from "../src/lib/auth/super-admin-core.mjs";

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

test("a hosted deployment never grants local development access", () => {
  // The dangerous case: a hosted app started with `npm run dev`, or with NODE_ENV unset,
  // must not hand out a super admin session just because it is not in production mode.
  assert.equal(allowsLocalDevelopmentAccess({ NODE_ENV: "development", RAILWAY_ENVIRONMENT: "production" }), false);
  assert.equal(allowsLocalDevelopmentAccess({ RAILWAY_ENVIRONMENT: "production" }), false);
  assert.equal(allowsLocalDevelopmentAccess({ NODE_ENV: "development", VERCEL: "1" }), false);
  assert.equal(allowsLocalDevelopmentAccess({ NODE_ENV: "development", RENDER: "true" }), false);
  assert.equal(allowsLocalDevelopmentAccess({ NODE_ENV: "development", FLY_APP_NAME: "fleetlever" }), false);
});
