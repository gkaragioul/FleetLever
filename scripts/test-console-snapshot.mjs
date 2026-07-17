import assert from "node:assert/strict";
import test from "node:test";

const coreModule = "../src/lib/fleetlever/console-snapshot-core.mjs";

function baseSnapshot() {
  return {
    schemaVersion: 5,
    organizationName: "  Acme Fleet  ",
    branding: {
      logo: null,
      banner: null,
      compactLogo: null,
    },
    customFieldDefinitions: [
      {
        id: "field-battery",
        module: "assets",
        name: "  Battery level  ",
        description: "Current charge",
        type: "percentage",
        required: false,
        defaultValue: null,
        options: [],
        order: 0,
        width: 130,
        archived: false,
        visibility: { table: true, form: true, export: true },
      },
    ],
    assetColumnLayout: [
      { id: "code", width: 120, hidden: false, order: 0 },
      { id: "custom:field-battery", width: 130, hidden: false, order: 1 },
    ],
    machines: [{ id: "asset-1", code: "EV-01", customFields: { "field-battery": 140 } }],
    notifications: [],
    releaseHistory: [],
    staff: [],
    worksites: [],
    updatedAt: "2026-07-17T00:00:00.000Z",
  };
}

test("normalizes organization customization and record values at the server boundary", async () => {
  const { normalizeConsoleSnapshotPayload } = await import(coreModule);
  const result = normalizeConsoleSnapshotPayload(baseSnapshot());

  assert.equal(result.organizationName, "Acme Fleet");
  assert.equal(result.schemaVersion, 5);
  assert.equal(result.customFieldDefinitions[0].name, "Battery level");
  assert.equal(result.machines[0].customFields["field-battery"], 100);
});

test("rejects unsafe branding payloads instead of persisting them", async () => {
  const { normalizeConsoleSnapshotPayload, SnapshotValidationError } = await import(coreModule);
  const snapshot = baseSnapshot();
  snapshot.branding.logo = {
    dataUrl: "data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+",
    fileName: "unsafe.svg",
    fit: "contain",
    positionX: 50,
    positionY: 50,
    zoom: 1,
  };

  assert.throws(() => normalizeConsoleSnapshotPayload(snapshot), SnapshotValidationError);
});

test("rejects duplicate custom-field identifiers", async () => {
  const { normalizeConsoleSnapshotPayload, SnapshotValidationError } = await import(coreModule);
  const snapshot = baseSnapshot();
  snapshot.customFieldDefinitions.push({ ...snapshot.customFieldDefinitions[0] });

  assert.throws(() => normalizeConsoleSnapshotPayload(snapshot), SnapshotValidationError);
});

test("preserves hidden or deleted custom values conservatively", async () => {
  const { normalizeConsoleSnapshotPayload } = await import(coreModule);
  const snapshot = baseSnapshot();
  snapshot.machines[0].customFields["field-archived"] = "keep for restore";

  const result = normalizeConsoleSnapshotPayload(snapshot);
  assert.equal(result.machines[0].customFields["field-archived"], "keep for restore");
});

test("enforces the maximum serialized request size before parsing", async () => {
  const { assertConsoleSnapshotTextSize, SnapshotValidationError } = await import(coreModule);
  assert.doesNotThrow(() => assertConsoleSnapshotTextSize("{}"));
  assert.throws(() => assertConsoleSnapshotTextSize("x".repeat(20 * 1024 * 1024 + 1)), SnapshotValidationError);
});
