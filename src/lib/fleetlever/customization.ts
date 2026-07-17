export type CustomFieldModule = "assets" | "assignments" | "service" | "documents" | "people";

export type CustomFieldType =
  | "short-text"
  | "long-text"
  | "number"
  | "percentage"
  | "currency"
  | "date"
  | "datetime"
  | "boolean"
  | "single-select"
  | "multi-select"
  | "url";

export type CustomFieldValue = string | number | boolean | string[] | null;

export type CustomFieldDefinition = {
  id: string;
  module: CustomFieldModule;
  name: string;
  description: string;
  type: CustomFieldType;
  required: boolean;
  defaultValue: CustomFieldValue;
  options: string[];
  order: number;
  width: number;
  archived: boolean;
  visibility: {
    table: boolean;
    form: boolean;
    export: boolean;
  };
};

export type BrandAsset = {
  dataUrl: string;
  fileName: string;
  fit: "contain" | "cover";
  positionX: number;
  positionY: number;
  zoom: number;
};

export type BrandingSettings = {
  logo: BrandAsset | null;
  banner: BrandAsset | null;
  compactLogo: BrandAsset | null;
};

export type AssetColumnLayout = {
  id: string;
  width: number;
  hidden: boolean;
  order: number;
};

export const defaultBrandingSettings: BrandingSettings = {
  logo: null,
  banner: null,
  compactLogo: null,
};

export const defaultAssetColumnLayout: AssetColumnLayout[] = [
  { id: "code", width: 120, hidden: false, order: 0 },
  { id: "name", width: 230, hidden: false, order: 1 },
  { id: "state", width: 140, hidden: false, order: 2 },
  { id: "owner", width: 160, hidden: false, order: 3 },
];

export const customFieldTypeLabels: Record<CustomFieldType, string> = {
  "short-text": "Short text",
  "long-text": "Long text",
  number: "Number",
  percentage: "Percentage",
  currency: "Currency",
  date: "Date",
  datetime: "Date and time",
  boolean: "Yes / no",
  "single-select": "Single select",
  "multi-select": "Multi-select",
  url: "URL",
};

export const customFieldModuleLabels: Record<CustomFieldModule, string> = {
  assets: "Assets",
  assignments: "Tomorrow's work",
  service: "Service workflow",
  documents: "Documents and evidence",
  people: "People and operators",
};

export function createCustomFieldDefinition(
  input: Pick<CustomFieldDefinition, "module" | "name" | "type"> & Partial<CustomFieldDefinition>,
  order: number,
): CustomFieldDefinition {
  return {
    id: input.id ?? `field-${crypto.randomUUID()}`,
    module: input.module,
    name: input.name.trim().slice(0, 80),
    description: input.description?.trim().slice(0, 240) ?? "",
    type: input.type,
    required: input.required ?? false,
    defaultValue: input.defaultValue ?? null,
    options: input.options?.map((option) => option.trim()).filter(Boolean).slice(0, 40) ?? [],
    order: input.order ?? order,
    width: Math.min(360, Math.max(100, input.width ?? 150)),
    archived: input.archived ?? false,
    visibility: input.visibility ?? { table: true, form: true, export: true },
  };
}

export function normalizedCustomFieldValue(field: CustomFieldDefinition, value: unknown): CustomFieldValue {
  if (value === null || value === undefined || value === "") return field.defaultValue;
  if (field.type === "boolean") return value === true || value === "true";
  if (field.type === "number" || field.type === "currency" || field.type === "percentage") {
    const number = typeof value === "number" ? value : Number.parseFloat(String(value));
    if (!Number.isFinite(number)) return null;
    return field.type === "percentage" ? Math.min(100, Math.max(0, number)) : number;
  }
  if (field.type === "multi-select") {
    return Array.isArray(value) ? value.map(String).filter((item) => field.options.includes(item)) : [];
  }
  return String(value).slice(0, field.type === "long-text" ? 2000 : 500);
}

export function customFieldDisplayValue(field: CustomFieldDefinition, value: CustomFieldValue | undefined) {
  const normalized = value ?? field.defaultValue;
  if (normalized === null || normalized === "" || (Array.isArray(normalized) && !normalized.length)) return "-";
  if (field.type === "percentage") return `${normalized}%`;
  if (field.type === "currency") return new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(Number(normalized));
  if (field.type === "boolean") return normalized ? "Yes" : "No";
  return Array.isArray(normalized) ? normalized.join(", ") : String(normalized);
}
