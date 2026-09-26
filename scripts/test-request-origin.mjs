import assert from "node:assert/strict";
import test from "node:test";
import { originMatches } from "../src/lib/security/request-origin.mjs";

function request(url, headers = {}) {
  return new Request(url, { method: "POST", headers });
}

test("accepts a matching direct origin", () => {
  assert.equal(originMatches(request("https://app.fleetlever.com/api/action", { origin: "https://app.fleetlever.com" })), true);
});

test("accepts a matching forwarded production origin", () => {
  assert.equal(originMatches(request("http://internal:3000/api/action", {
    origin: "https://app.fleetlever.com",
    "x-forwarded-host": "app.fleetlever.com",
    "x-forwarded-proto": "https",
  })), true);
});

test("accepts an explicitly trusted public proxy origin", () => {
  assert.equal(
    originMatches(
      request("https://app.example.com/api/action", {
        origin: "https://fleetlever.com",
      }),
      ["https://fleetlever.com"],
    ),
    true,
  );
});

test("rejects cross-origin and malformed origins", () => {
  assert.equal(originMatches(request("https://app.fleetlever.com/api/action", { origin: "https://attacker.example" })), false);
  assert.equal(originMatches(request("https://app.fleetlever.com/api/action", { origin: "not a URL" })), false);
});

test("rejects browser cross-site requests that omit Origin", () => {
  assert.equal(originMatches(request("https://app.fleetlever.com/api/action", { "sec-fetch-site": "cross-site" })), false);
  assert.equal(originMatches(request("https://app.fleetlever.com/api/action", { "sec-fetch-site": "same-origin" })), true);
});
