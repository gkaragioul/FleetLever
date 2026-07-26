export type SuperAdminSessionPayload = {
  role: "super_admin";
  username: string;
  expiresAt: number;
};

export function isHostedDeployment(env?: Record<string, string | undefined>): boolean;
export function allowsLocalDevelopmentAccess(env?: Record<string, string | undefined>): boolean;
export function sessionSecret(env?: Record<string, string | undefined>): string;
export function encodeSession(session: SuperAdminSessionPayload, secret: string): string;
export function decodeSession(value: unknown, secret: string, now?: number): SuperAdminSessionPayload | null;
