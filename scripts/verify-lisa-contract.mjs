import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [route, serverConfig, consoleSource, bridge, bridgeCore] = await Promise.all([
  readFile("src/app/api/fleetlever/lisa/chat/route.ts", "utf8"),
  readFile("src/lib/lisa/server.ts", "utf8"),
  readFile("src/components/fleetlever/construction-prototype.tsx", "utf8"),
  readFile("scripts/lisa-bridge.mjs", "utf8"),
  readFile("scripts/lib/lisa-bridge-core.mjs", "utf8"),
]);

assert.match(serverConfig, /FLEETLEVER_LISA_BRIDGE_URL/);
assert.match(serverConfig, /FLEETLEVER_LISA_BRIDGE_SECRET/);
assert.match(route, /text\/event-stream/);
assert.match(route, /requireFleetLeverApiSession/);
assert.match(route, /activeAccess:\s*true/);

assert.match(consoleSource, /\/api\/fleetlever\/lisa\/chat/);
assert.match(consoleSource, /\/api\/fleetlever\/lisa\/health/);
assert.doesNotMatch(consoleSource, /function lisaAnswerForIntent/);
assert.doesNotMatch(consoleSource, /const intent: LisaIntent/);

assert.match(bridge, /127\.0\.0\.1/);
assert.match(bridge, /CODEX_BIN:\s*codexBin/);
assert.match(bridgeCore, /read-only/);
assert.doesNotMatch(`${bridge}\n${bridgeCore}`, /dangerously-bypass/);

console.log("Lisa bridge and console contract verified.");
