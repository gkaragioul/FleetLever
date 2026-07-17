import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [consoleSource, settingsSource, typesSource, tenantSource, productionConsoleSource, stateRouteSource, stateDatabaseSource] = await Promise.all([
  readFile("src/components/fleetlever/construction-prototype.tsx", "utf8"),
  readFile("src/components/fleetlever/settings-view.tsx", "utf8"),
  readFile("src/lib/fleetlever/customization.ts", "utf8"),
  readFile("src/lib/db/tenant-context.ts", "utf8"),
  readFile("src/lib/console/production-console.ts", "utf8"),
  readFile("src/app/api/fleetlever/console-state/route.ts", "utf8"),
  readFile("src/lib/db/console-state.ts", "utf8"),
]);

assert.match(consoleSource, /schemaVersion:\s*5/);
assert.match(consoleSource, /customFieldDefinitions/);
assert.match(consoleSource, /branding/);
assert.match(consoleSource, /downloadCsvFile/);
assert.match(consoleSource, /downloadXlsxFile/);
assert.match(settingsSource, /Battery level/);
assert.match(settingsSource, /image\/png,image\/jpeg,image\/webp/);
assert.match(settingsSource, /canvas\.toDataURL/);
assert.match(settingsSource, /Pan and zoom|Zoom/);
assert.match(settingsSource, /onDrop=/);
assert.match(settingsSource, /onDragOver=/);
assert.match(settingsSource, /Default value/);
assert.match(typesSource, /percentage/);
assert.match(typesSource, /multi-select/);
assert.match(typesSource, /table/);
assert.match(typesSource, /form/);
assert.match(typesSource, /export/);
assert.match(tenantSource, /getAccountSession/);
assert.match(tenantSource, /account\.organizationId/);
assert.match(productionConsoleSource, /schemaVersion:\s*5/);
assert.match(productionConsoleSource, /branding:/);
assert.match(productionConsoleSource, /customFieldDefinitions:/);
assert.match(productionConsoleSource, /assetColumnLayout:/);
assert.match(productionConsoleSource, /staff:/);
assert.match(stateRouteSource, /originMatches/);
assert.match(stateDatabaseSource, /console\.customization_updated/);

console.log("Tenant branding and custom-field contract verified.");
