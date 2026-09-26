import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { clientIpFromHeaders, clientRateLimitKey, trustedProxyHops } from "../src/lib/security/client-ip.mjs";

const headers = (values) => new Headers(values);

test("a forged X-Forwarded-For entry cannot choose the rate-limit bucket", () => {
  // The client sent "203.0.113.9"; the platform proxy appended the real peer address.
  const request = headers({ "x-forwarded-for": "203.0.113.9, 198.51.100.7" });
  assert.equal(clientIpFromHeaders(request, {}), "198.51.100.7");
  assert.equal(clientRateLimitKey(headers({ "x-forwarded-for": "1.1.1.1, 198.51.100.7" }), {}), "198.51.100.7");
  assert.equal(clientRateLimitKey(headers({ "x-forwarded-for": "2.2.2.2, 198.51.100.7" }), {}), "198.51.100.7");
});

test("each extra trusted proxy moves one entry further left", () => {
  const request = headers({ "x-forwarded-for": "203.0.113.9, 192.0.2.44, 10.0.0.3" });
  assert.equal(clientIpFromHeaders(request, { FLEETLEVER_TRUSTED_PROXY_HOPS: "2" }), "192.0.2.44");
  assert.equal(clientIpFromHeaders(request, { FLEETLEVER_TRUSTED_PROXY_HOPS: "3" }), "203.0.113.9");
});

test("a chain shorter than the trusted proxy count is not guessed at", () => {
  const request = headers({ "x-forwarded-for": "198.51.100.7" });
  assert.equal(clientIpFromHeaders(request, { FLEETLEVER_TRUSTED_PROXY_HOPS: "2" }), null);
  assert.equal(clientRateLimitKey(request, { FLEETLEVER_TRUSTED_PROXY_HOPS: "2" }), "unknown");
  assert.equal(clientIpFromHeaders(headers({}), {}), null);
});

test("x-real-ip is ignored unless the operator names it as the trusted header", () => {
  const request = headers({ "x-real-ip": "203.0.113.9", "x-forwarded-for": "198.51.100.7" });
  assert.equal(clientIpFromHeaders(request, {}), "198.51.100.7");
  assert.equal(clientIpFromHeaders(request, { FLEETLEVER_CLIENT_IP_HEADER: "X-Real-IP" }), "203.0.113.9");
  assert.equal(
    clientIpFromHeaders(headers({ "x-vercel-forwarded-for": "192.0.2.10" }), { FLEETLEVER_CLIENT_IP_HEADER: "x-vercel-forwarded-for" }),
    "192.0.2.10",
  );
});

test("zero trusted hops disables header-based addresses and bad settings fall back to one hop", () => {
  const request = headers({ "x-forwarded-for": "203.0.113.9, 198.51.100.7" });
  assert.equal(clientIpFromHeaders(request, { FLEETLEVER_TRUSTED_PROXY_HOPS: "0" }), null);
  for (const value of ["-1", "abc", "1.5", "99"]) {
    assert.equal(trustedProxyHops({ FLEETLEVER_TRUSTED_PROXY_HOPS: value }), 1, value);
  }
});

test("values that are not addresses are rejected rather than used as keys", () => {
  assert.equal(clientIpFromHeaders(headers({ "x-forwarded-for": "evil, not-an-ip" }), {}), null);
  assert.equal(clientIpFromHeaders(headers({ "x-forwarded-for": `1.1.1.1, ${"9".repeat(80)}` }), {}), null);
  assert.equal(clientIpFromHeaders(headers({ "x-forwarded-for": "2001:DB8::1" }), {}), "2001:db8::1");
});

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? sourceFiles(full) : [full];
    }),
  );
  return files.flat().filter((file) => /\.(ts|tsx|mjs)$/.test(file));
}

test("only the shared helper reads forwarding headers", async () => {
  const offenders = [];
  for (const file of await sourceFiles("src")) {
    if (file.replaceAll("\\", "/").endsWith("src/lib/security/client-ip.mjs")) continue;
    const source = await readFile(file, "utf8");
    if (/x-forwarded-for|x-real-ip/i.test(source)) offenders.push(file);
  }
  assert.deepEqual(offenders, []);

  for (const file of [
    "src/app/login/actions.ts",
    "src/app/signup/actions.ts",
    "src/app/forgot-password/actions.ts",
    "src/app/reset-password/actions.ts",
    "src/app/api/auth/google/callback/route.ts",
  ]) {
    assert.match(await readFile(file, "utf8"), /@\/lib\/security\/client-ip\.mjs/, `${file} must use the shared client address helper`);
  }
  assert.match(await readFile("src/app/login/actions.ts", "utf8"), /login:account:/, "the per-account login limit must stay");
});
