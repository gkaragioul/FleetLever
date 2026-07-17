import type {
  AssetColumnLayout,
  BrandingSettings,
  CustomFieldDefinition,
} from "./customization";

export class SnapshotValidationError extends Error {}

export type NormalizedConsoleSnapshot = {
  schemaVersion: 5;
  organizationName: string;
  branding: BrandingSettings;
  customFieldDefinitions: CustomFieldDefinition[];
  assetColumnLayout: AssetColumnLayout[];
  machines: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
  releaseHistory: Record<string, unknown>[];
  staff: Record<string, unknown>[];
  updatedAt: string;
  worksites: Record<string, unknown>[];
  [key: string]: unknown;
};

export function assertConsoleSnapshotTextSize(text: string): void;
export function normalizeConsoleSnapshotPayload(value: unknown): NormalizedConsoleSnapshot;
