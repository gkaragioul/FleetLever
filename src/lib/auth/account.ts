import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getDbPool } from "@/lib/db/client";
import {
  createPasswordHash,
  hashOpaqueToken,
  normalizeEmail,
  trialAccessState,
  verifyPassword,
} from "@/lib/auth/account-core.mjs";

export const accountSessionCookieName = "fleetlever_account_session";
const sessionDurationSeconds = 60 * 60 * 24 * 30;

type AccountRow = {
  profile_id: string;
  organization_id: string;
  member_role: string;
  account_email?: string;
  full_name?: string;
  password_hash?: string | null;
  email_verified_at?: string | null;
  organization_name?: string;
  organization_status?: string;
  trial_started_at: string;
  trial_ends_at: string;
  session_expires_at?: string;
};

export type FleetLeverAccountSession = {
  profileId: string;
  organizationId: string;
  role: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  organizationName: string;
  organizationStatus: string;
  expiresAt: string;
  trial: {
    startedAt: string;
    endsAt: string;
    active: boolean;
    expired: boolean;
    daysRemaining: number;
  };
};

function isHostedDeployment() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.VERCEL);
}

function randomOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

function sessionFromRow(row: AccountRow): FleetLeverAccountSession {
  const trial = trialAccessState(row.trial_started_at, row.trial_ends_at);
  const subscribed = row.organization_status === "active";
  return {
    profileId: row.profile_id,
    organizationId: row.organization_id,
    role: row.member_role,
    email: row.account_email ?? "",
    fullName: row.full_name ?? "FleetLever user",
    emailVerified: Boolean(row.email_verified_at),
    organizationName: row.organization_name ?? "FleetLever organization",
    organizationStatus: row.organization_status ?? "trial",
    expiresAt: row.session_expires_at ?? row.trial_ends_at,
    trial: {
      startedAt: row.trial_started_at,
      endsAt: row.trial_ends_at,
      active: subscribed || trial.active,
      expired: !subscribed && trial.expired,
      daysRemaining: subscribed ? 0 : trial.daysRemaining,
    },
  };
}

async function accountByEmail(email: string) {
  const result = await getDbPool().query<AccountRow>("select * from app_private.account_by_email($1::citext)", [normalizeEmail(email)]);
  return result.rows[0] ?? null;
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(accountSessionCookieName, token, {
    httpOnly: true,
    maxAge: sessionDurationSeconds,
    path: "/",
    sameSite: "lax",
    secure: isHostedDeployment(),
    priority: "high",
  });
}

export async function createAccountSession(
  account: Pick<AccountRow, "profile_id" | "organization_id">,
  metadata: { ipAddress?: string | null; userAgent?: string | null } = {},
) {
  const token = randomOpaqueToken();
  const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000);
  await getDbPool().query(
    `insert into public.auth_sessions (token_hash, profile_id, organization_id, expires_at, ip_address, user_agent)
     values ($1, $2, $3, $4, nullif($5, '')::inet, left($6, 500))`,
    [hashOpaqueToken(token), account.profile_id, account.organization_id, expiresAt, metadata.ipAddress ?? "", metadata.userAgent ?? ""],
  );
  await setSessionCookie(token);
}

export async function registerEmailAccount(input: {
  email: string;
  fullName: string;
  organizationName: string;
  password: string;
}) {
  const email = normalizeEmail(input.email);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
  if (input.fullName.trim().length < 2 || input.fullName.trim().length > 160) throw new Error("Enter your full name.");
  if (input.organizationName.trim().length < 2 || input.organizationName.trim().length > 160) throw new Error("Enter your organization name.");
  if (input.password.length < 12 || input.password.length > 200) throw new Error("Use at least 12 characters for your password.");

  const passwordHash = createPasswordHash(input.password);
  const result = await getDbPool().query<AccountRow>(
    "select * from app_private.register_email_account($1::citext, $2, $3, $4)",
    [email, input.fullName.trim(), input.organizationName.trim(), passwordHash],
  );
  const account = result.rows[0];
  if (!account) throw new Error("The account could not be created.");
  const verificationToken = await issueAccountToken(account.profile_id, "email_verification", 24 * 60);
  return { account, verificationToken };
}

export async function authenticateEmailAccount(email: string, password: string) {
  const account = await accountByEmail(email);
  if (!account?.password_hash || !verifyPassword(password, account.password_hash)) return null;
  return account;
}

export async function upsertGoogleAccount(input: { subject: string; email: string; fullName: string }) {
  const result = await getDbPool().query<AccountRow>(
    "select * from app_private.upsert_google_account($1, $2::citext, $3)",
    [input.subject, normalizeEmail(input.email), input.fullName.trim()],
  );
  return result.rows[0] ?? null;
}

export async function getAccountSession(): Promise<FleetLeverAccountSession | null> {
  if (!process.env.DATABASE_URL) return null;
  const token = (await cookies()).get(accountSessionCookieName)?.value;
  if (!token) return null;
  const result = await getDbPool().query<AccountRow>(
    "select * from app_private.account_session_by_hash($1::char(64))",
    [hashOpaqueToken(token)],
  );
  return result.rows[0] ? sessionFromRow(result.rows[0]) : null;
}

export async function clearAccountSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(accountSessionCookieName)?.value;
  if (token && process.env.DATABASE_URL) {
    await getDbPool().query("update public.auth_sessions set revoked_at = now() where token_hash = $1", [hashOpaqueToken(token)]).catch(() => {});
  }
  cookieStore.delete(accountSessionCookieName);
}

export async function issueAccountToken(profileId: string, kind: "email_verification" | "password_reset", durationMinutes: number) {
  const token = randomOpaqueToken();
  await getDbPool().query(
    `insert into public.auth_tokens (token_hash, profile_id, kind, expires_at)
     values ($1, $2, $3, now() + ($4 * interval '1 minute'))`,
    [hashOpaqueToken(token), profileId, kind, durationMinutes],
  );
  return token;
}

export async function requestPasswordReset(email: string) {
  const account = await accountByEmail(email);
  if (!account) return null;
  return issueAccountToken(account.profile_id, "password_reset", 60);
}

export async function consumeEmailVerification(token: string) {
  const result = await getDbPool().query<{ consumed: boolean }>(
    "select app_private.consume_email_verification($1::char(64)) as consumed",
    [hashOpaqueToken(token)],
  );
  return Boolean(result.rows[0]?.consumed);
}

export async function consumePasswordReset(token: string, password: string) {
  if (password.length < 12 || password.length > 200) throw new Error("Use at least 12 characters for your password.");
  const result = await getDbPool().query<{ consumed: boolean }>(
    "select app_private.consume_password_reset($1::char(64), $2) as consumed",
    [hashOpaqueToken(token), createPasswordHash(password)],
  );
  return Boolean(result.rows[0]?.consumed);
}
