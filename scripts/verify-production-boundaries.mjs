import assert from "node:assert/strict";

// Point these at your own deployment. The defaults are the local editions (npm run dev:console / dev:site).
const appOrigin = (process.env.FLEETLEVER_PRODUCTION_APP_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const siteOrigin = (process.env.FLEETLEVER_PRODUCTION_SITE_URL ?? "http://127.0.0.1:3002").replace(/\/$/, "");
const siteHealthOrigin = (process.env.FLEETLEVER_PRODUCTION_SITE_HEALTH_URL ?? siteOrigin).replace(/\/$/, "");

async function request(url, options = {}) {
  return fetch(url, {
    signal: AbortSignal.timeout(20_000),
    ...options,
  });
}

async function verifyHealth(origin, expectedEdition, expectedService) {
  const response = await request(`${origin}/api/health`, { redirect: "manual" });
  assert.equal(response.status, 200, `${origin}/api/health must return 200`);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/i, "Health responses must not be cached");

  const body = await response.json();
  assert.deepEqual(Object.keys(body).sort(), ["checks", "edition", "ok", "service"], "Health output must keep its minimal public contract");
  assert.equal(body.ok, true);
  assert.equal(body.edition, expectedEdition);
  assert.equal(body.service, expectedService);
  assert.ok(Object.values(body.checks).every((value) => value === "ok"), `${expectedService} health checks must all pass`);

  const serialized = JSON.stringify(body);
  for (const forbidden of ["organizationId", "profileId", "databaseName", "databaseUser", "missingTables", "migrations", "bucket"]) {
    assert.ok(!serialized.includes(forbidden), `Health output must not expose ${forbidden}`);
  }
}

await verifyHealth(appOrigin, "console", "fleetlever");
await verifyHealth(siteHealthOrigin, "site", "fleetlever-site");

const protectedPage = await request(`${appOrigin}/fleet-management`, { redirect: "manual" });
assert.ok([302, 303, 307, 308].includes(protectedPage.status), "Unauthenticated console access must redirect");
assert.match(protectedPage.headers.get("location") ?? "", /\/login(?:\?|$)/, "Protected console access must redirect to login");

const loginPage = await request(`${appOrigin}/login`);
assert.equal(loginPage.status, 200, "The account login page must be available");

const commercialSite = await request(`${siteOrigin}/`);
assert.equal(commercialSite.status, 200, "The commercial site must be available");

console.log("PASS production health, auth boundary, and public-site checks");
