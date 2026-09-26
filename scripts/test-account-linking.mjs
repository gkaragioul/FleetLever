import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

import { createPasswordHash, hashOpaqueToken } from "../src/lib/auth/account-core.mjs";

// These tests run the real migrations in an in-memory PostgreSQL (PGlite), so they exercise the
// account functions the app calls in production rather than a copy of their logic.

const migrationsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
let db;
let sequence = 0;

before(async () => {
  db = await PGlite.create({ extensions: { citext, pgcrypto } });
  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(await readFile(path.join(migrationsDirectory, file), "utf8"));
  }
});

after(async () => {
  await db?.close();
});

function uniqueEmail(label) {
  sequence += 1;
  return `${label}-${sequence}@example.com`;
}

function opaqueToken() {
  return randomBytes(32).toString("base64url");
}

async function registerWithPassword(email) {
  const result = await db.query(
    "select * from app_private.register_email_account($1::citext, $2, $3, $4)",
    [email, "Registered Name", "Registered Org", createPasswordHash("a-password-of-twelve")],
  );
  return result.rows[0];
}

async function signInWithGoogle(subject, email) {
  const result = await db.query("select * from app_private.upsert_google_account($1, $2::citext, $3)", [
    subject,
    email,
    "Google User",
  ]);
  return result.rows[0];
}

async function openSession(account) {
  const token = opaqueToken();
  await db.query("select app_private.create_auth_session($1::char(64), $2::uuid, $3::uuid, now() + interval '7 days', '', '')", [
    hashOpaqueToken(token),
    account.profile_id,
    account.organization_id,
  ]);
  return token;
}

async function sessionIsValid(token) {
  const result = await db.query("select * from app_private.account_session_by_hash($1::char(64))", [hashOpaqueToken(token)]);
  return result.rows.length === 1;
}

async function hasPassword(profileId) {
  const result = await db.query("select count(*)::int as count from app_private.account_credentials where profile_id = $1::uuid", [
    profileId,
  ]);
  return result.rows[0].count === 1;
}

async function emailVerifiedAt(profileId) {
  const result = await db.query("select email_verified_at from public.profiles where id = $1::uuid", [profileId]);
  return result.rows[0].email_verified_at;
}

async function redeemAccountToken(profileId, kind, consume) {
  const token = opaqueToken();
  await db.query("select app_private.issue_auth_token($1::char(64), $2::uuid, $3, 60)", [hashOpaqueToken(token), profileId, kind]);
  return consume(hashOpaqueToken(token));
}

async function verifyEmail(profileId) {
  return redeemAccountToken(profileId, "email_verification", (hash) =>
    db.query("select app_private.consume_email_verification($1::char(64)) as ok", [hash]),
  );
}

async function resetPassword(profileId) {
  return redeemAccountToken(profileId, "password_reset", (hash) =>
    db.query("select app_private.consume_password_reset($1::char(64), $2) as ok", [hash, createPasswordHash("a-new-password-12")]),
  );
}

test("a Google sign-in evicts whoever registered the address without proving it", async () => {
  // Someone registers the victim's address with their own password and keeps a session open.
  const email = uniqueEmail("victim");
  const squatter = await registerWithPassword(email);
  const squatterSession = await openSession(squatter);
  assert.equal(await emailVerifiedAt(squatter.profile_id), null);

  // The real owner later signs in with Google, which proves control of the address.
  const owner = await signInWithGoogle("google-subject-victim", email);

  assert.equal(owner.profile_id, squatter.profile_id, "the owner keeps the existing workspace");
  assert.equal(await hasPassword(owner.profile_id), false, "the unproven password must no longer work");
  assert.equal(await sessionIsValid(squatterSession), false, "the unproven registrant's sessions must be revoked");
  assert.notEqual(await emailVerifiedAt(owner.profile_id), null, "the address is now verified");
});

test("a verified password account keeps its password and sessions when Google is linked", async () => {
  const email = uniqueEmail("verified");
  const account = await registerWithPassword(email);
  await verifyEmail(account.profile_id);
  const session = await openSession(account);

  const linked = await signInWithGoogle("google-subject-verified", email);

  assert.equal(linked.profile_id, account.profile_id);
  assert.equal(await hasPassword(account.profile_id), true);
  assert.equal(await sessionIsValid(session), true);
});

test("a completed password reset proves the address, so a later Google sign-in keeps that password", async () => {
  const email = uniqueEmail("reset");
  const account = await registerWithPassword(email);
  await resetPassword(account.profile_id);

  assert.notEqual(await emailVerifiedAt(account.profile_id), null, "the reset link reached the address");

  const linked = await signInWithGoogle("google-subject-reset", email);
  assert.equal(linked.profile_id, account.profile_id);
  assert.equal(await hasPassword(account.profile_id), true, "the password the owner chose must survive");
});

test("a returning Google user signs in to the same profile without touching other accounts", async () => {
  const email = uniqueEmail("returning");
  const first = await signInWithGoogle("google-subject-returning", email);
  const session = await openSession(first);
  const second = await signInWithGoogle("google-subject-returning", email);

  assert.equal(second.profile_id, first.profile_id);
  assert.equal(second.organization_id, first.organization_id);
  assert.equal(await sessionIsValid(session), true);
});

test("a new Google user gets a verified profile and a trial organization", async () => {
  const email = uniqueEmail("new");
  const account = await signInWithGoogle("google-subject-new", email);

  assert.equal(account.member_role, "owner");
  assert.notEqual(await emailVerifiedAt(account.profile_id), null);
  assert.equal(await hasPassword(account.profile_id), false);
});
