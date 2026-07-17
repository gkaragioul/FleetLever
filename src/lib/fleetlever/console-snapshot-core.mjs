const maxSnapshotBytes = 20 * 1024 * 1024;
const maxBrandFileBytes = 5 * 1024 * 1024;
const maxCustomFields = 150;

const modules = new Set(["assets", "assignments", "service", "documents", "people"]);
const fieldTypes = new Set([
  "short-text",
  "long-text",
  "number",
  "percentage",
  "currency",
  "date",
  "datetime",
  "boolean",
  "single-select",
  "multi-select",
  "url",
]);
const defaultAssetColumnLayout = [
  { id: "code", width: 120, hidden: false, order: 0 },
  { id: "name", width: 230, hidden: false, order: 1 },
  { id: "state", width: 140, hidden: false, order: 2 },
  { id: "owner", width: 160, hidden: false, order: 3 },
];

export class SnapshotValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "SnapshotValidationError";
  }
}

function reject(message) {
  throw new SnapshotValidationError(message);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value, label, maximum, fallback = "") {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string") reject(`${label} must be text.`);
  return value.trim().slice(0, maximum);
}

function boundedNumber(value, minimum, maximum, fallback) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, number));
}

function normalizePrimitive(value, maximum = 2000) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.slice(0, maximum);
  if (Array.isArray(value)) return value.slice(0, 40).map((item) => String(item).slice(0, 240));
  return null;
}

function normalizeKnownValue(field, value) {
  if (value === undefined || value === null || value === "") return normalizePrimitive(field.defaultValue);
  if (field.type === "boolean") return value === true || value === "true";
  if (field.type === "number" || field.type === "currency" || field.type === "percentage") {
    const number = typeof value === "number" ? value : Number.parseFloat(String(value));
    if (!Number.isFinite(number)) return null;
    return field.type === "percentage" ? Math.min(100, Math.max(0, number)) : number;
  }
  if (field.type === "multi-select") {
    return Array.isArray(value)
      ? value.map(String).filter((item) => field.options.includes(item)).slice(0, 40)
      : [];
  }
  if (field.type === "single-select") {
    const option = String(value);
    return field.options.includes(option) ? option : null;
  }
  return String(value).slice(0, field.type === "long-text" ? 2000 : 500);
}

function normalizeBrandAsset(value, label) {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) reject(`${label} must be an image asset.`);

  const dataUrl = boundedString(value.dataUrl, `${label} data`, 8 * 1024 * 1024);
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) reject(`${label} must be a PNG, JPEG, or WebP data URL.`);
  if (Buffer.byteLength(match[2], "base64") > maxBrandFileBytes) reject(`${label} exceeds 5 MB.`);

  return {
    dataUrl,
    fileName: boundedString(value.fileName, `${label} file name`, 140, "brand-image"),
    fit: value.fit === "cover" ? "cover" : "contain",
    positionX: boundedNumber(value.positionX, 0, 100, 50),
    positionY: boundedNumber(value.positionY, 0, 100, 50),
    zoom: boundedNumber(value.zoom, 1, 2.5, 1),
  };
}

function normalizeFieldDefinition(value, index) {
  if (!isRecord(value)) reject(`Custom field ${index + 1} is invalid.`);
  const id = boundedString(value.id, "Custom field ID", 110);
  if (!/^field-[A-Za-z0-9-]+$/.test(id)) reject(`Custom field ${index + 1} has an invalid ID.`);
  if (!modules.has(value.module)) reject(`Custom field ${id} has an invalid module.`);
  if (!fieldTypes.has(value.type)) reject(`Custom field ${id} has an invalid type.`);

  const name = boundedString(value.name, `Custom field ${id} name`, 80);
  if (!name) reject(`Custom field ${id} needs a name.`);
  const options = Array.isArray(value.options)
    ? [...new Set(value.options.map((option) => String(option).trim().slice(0, 80)).filter(Boolean))].slice(0, 40)
    : [];
  const visibility = isRecord(value.visibility) ? value.visibility : {};
  const field = {
    id,
    module: value.module,
    name,
    description: boundedString(value.description, `Custom field ${id} description`, 240),
    type: value.type,
    required: value.required === true,
    defaultValue: null,
    options,
    order: Math.trunc(boundedNumber(value.order, 0, maxCustomFields, index)),
    width: Math.trunc(boundedNumber(value.width, 100, 360, 150)),
    archived: value.archived === true,
    visibility: {
      table: visibility.table !== false,
      form: visibility.form !== false,
      export: visibility.export !== false,
    },
  };
  field.defaultValue = normalizeKnownValue(field, value.defaultValue);
  return field;
}

function normalizeCustomFields(value, fieldMap) {
  if (value === undefined || value === null) return {};
  if (!isRecord(value)) reject("Record custom fields must be an object.");
  const result = {};
  for (const [key, rawValue] of Object.entries(value).slice(0, 200)) {
    if (!/^field-[A-Za-z0-9-]+$/.test(key)) continue;
    const field = fieldMap.get(key);
    result[key] = field ? normalizeKnownValue(field, rawValue) : normalizePrimitive(rawValue);
  }
  return result;
}

function normalizeRecord(value, fieldMap) {
  if (!isRecord(value)) reject("Snapshot records must be objects.");
  return {
    ...value,
    customFields: normalizeCustomFields(value.customFields, fieldMap),
  };
}

function normalizeRecordArray(value, label, maximum, fieldMap) {
  if (!Array.isArray(value)) reject(`${label} must be a list.`);
  if (value.length > maximum) reject(`${label} exceeds the supported limit.`);
  return value.map((record) => normalizeRecord(record, fieldMap));
}

function normalizeMachine(value, fieldMaps) {
  const machine = normalizeRecord(value, fieldMaps.assets);
  if (machine.certificates !== undefined) {
    machine.certificates = normalizeRecordArray(machine.certificates, "Machine documents", 500, fieldMaps.documents);
  }
  if (machine.service !== undefined) {
    machine.service = normalizeRecordArray(machine.service, "Machine service items", 500, fieldMaps.service);
  }
  return machine;
}

function normalizeColumns(value) {
  const source = value === undefined ? defaultAssetColumnLayout : value;
  if (!Array.isArray(source)) reject("Asset column layout must be a list.");
  if (source.length > 200) reject("Asset column layout exceeds the supported limit.");
  const seen = new Set();
  return source.map((column, index) => {
    if (!isRecord(column)) reject(`Asset column ${index + 1} is invalid.`);
    const id = boundedString(column.id, "Asset column ID", 130);
    if (!/^(?:[A-Za-z][A-Za-z0-9-]*|custom:field-[A-Za-z0-9-]+)$/.test(id)) reject(`Asset column ${index + 1} has an invalid ID.`);
    if (seen.has(id)) reject(`Asset column ${id} is duplicated.`);
    seen.add(id);
    return {
      id,
      width: Math.trunc(boundedNumber(column.width, 80, 480, 150)),
      hidden: column.hidden === true,
      order: Math.trunc(boundedNumber(column.order, 0, 200, index)),
    };
  });
}

export function assertConsoleSnapshotTextSize(text) {
  if (typeof text !== "string") reject("Snapshot body must be text.");
  if (Buffer.byteLength(text, "utf8") > maxSnapshotBytes) reject("Snapshot exceeds the 20 MB limit.");
}

export function normalizeConsoleSnapshotPayload(value) {
  if (!isRecord(value)) reject("Snapshot must be an object.");
  if (![1, 4, 5].includes(value.schemaVersion)) reject("Unsupported FleetLever snapshot version.");

  const rawDefinitions = value.customFieldDefinitions ?? [];
  if (!Array.isArray(rawDefinitions)) reject("Custom field definitions must be a list.");
  if (rawDefinitions.length > maxCustomFields) reject("Too many custom field definitions.");
  const customFieldDefinitions = rawDefinitions.map(normalizeFieldDefinition);
  const ids = new Set();
  for (const field of customFieldDefinitions) {
    if (ids.has(field.id)) reject(`Custom field ${field.id} is duplicated.`);
    ids.add(field.id);
  }
  const fieldMaps = Object.fromEntries([...modules].map((module) => [module, new Map() ]));
  for (const field of customFieldDefinitions) fieldMaps[field.module].set(field.id, field);

  if (!Array.isArray(value.machines) || value.machines.length > 10000) reject("Machines must be a supported list.");
  const machines = value.machines.map((machine) => normalizeMachine(machine, fieldMaps));
  const worksites = normalizeRecordArray(value.worksites, "Worksites", 5000, fieldMaps.assignments);
  const staff = normalizeRecordArray(value.staff ?? [], "Staff", 10000, fieldMaps.people);
  const notifications = normalizeRecordArray(value.notifications, "Notifications", 20000, new Map());
  const releaseHistory = normalizeRecordArray(value.releaseHistory, "Release history", 50000, new Map());

  return {
    ...value,
    schemaVersion: 5,
    organizationName: boundedString(value.organizationName, "Organization name", 160, "FleetLever"),
    branding: {
      logo: normalizeBrandAsset(value.branding?.logo, "Logo"),
      compactLogo: normalizeBrandAsset(value.branding?.compactLogo, "Compact logo"),
      banner: normalizeBrandAsset(value.branding?.banner, "Banner"),
    },
    customFieldDefinitions,
    assetColumnLayout: normalizeColumns(value.assetColumnLayout),
    machines,
    notifications,
    releaseHistory,
    staff,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt.slice(0, 50) : new Date(0).toISOString(),
    worksites,
  };
}
