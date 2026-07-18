export function normalizeEmail(value: unknown): string;
export function normalizeAccountIdentifier(value: unknown): string;
export function createPasswordHash(password: string): string;
export function verifyPassword(password: string, storedHash: string): boolean;
export function hashOpaqueToken(token: string): string;
export function safeRedirectPath(value: unknown, fallback?: string): string;
export function trialAccessState(startedAt: string, endsAt: string, now?: number): {
  active: boolean;
  daysRemaining: number;
  expired: boolean;
};
