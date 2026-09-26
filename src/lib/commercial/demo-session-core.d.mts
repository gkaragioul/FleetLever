export type DemoSession = {
  id: string;
  createdAt: string;
  expiresAt: string;
  snapshot: unknown | null;
  updatedAt: string;
};

export type DemoSessionLookup = { status: "active"; session: DemoSession } | { status: "expired" | "missing" };

export type DemoSessionStore = {
  create(): Promise<DemoSession>;
  read(id: string): Promise<DemoSessionLookup>;
  writeSnapshot(id: string, snapshot: unknown): Promise<DemoSessionLookup>;
  cleanupExpired(): Promise<void>;
  size(): number;
};

export function createDemoSessionStore(options: {
  directory: string;
  ttlMs: number;
  maxSessions: number;
  fs?: unknown;
  now?: () => number;
  newId?: () => string;
}): DemoSessionStore;

export function demoSessionLimit(env?: Record<string, string | undefined>): number;
