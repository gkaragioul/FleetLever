# FleetLever security operations

## Account data

- Account identity and tenant membership live in Railway PostgreSQL.
- Normalized email and profile details live in `public.profiles`.
- Password hashes live only in `app_private.account_credentials` and use salted `scrypt-v1` hashes.
- Session and account-action tokens are random opaque values. PostgreSQL stores only SHA-256 token hashes.
- The runtime role cannot read credential, session, token, OAuth identity, or rate-limit tables directly.
- A Google sign-in joins an existing profile with the same email only as its proven owner: if that email
  was never verified, the profile's password and sessions are removed before linking (migration 0013).
  A completed password reset counts as verification.
- All tenant data uses forced row-level security and active organization membership checks.

## Production database contract

- `fleetlever-app.DATABASE_URL` references `Postgres.APP_DATABASE_PRIVATE_URL`.
- `fleetlever-app.MIGRATION_DATABASE_URL` references `Postgres.DATABASE_URL`.
- The app and PostgreSQL services must remain in the same Railway environment and region.
- Public database proxies must never run in production without certificate verification.
- Railway's private hostname may use encrypted transport without public-CA verification because it is reachable only inside the project private network.

## Required recurring operations

1. Run `npm run test:security`, `npm run test:auth`, and `npm run test:db-security` for each security-sensitive release.
2. Review Railway deploy and application logs for failed sign-ins, throttling, upload rejection, and database errors.
3. Rotate the restricted database-role password and relay secrets after staff changes or suspected exposure.
4. Export and restore-test a database backup at least quarterly.
5. Enable Railway scheduled volume backups before handling production customer data. Point-in-time recovery is optional and cost-bearing; enable it only after reviewing Railway billing.
6. Configure `RESEND_API_KEY` and `FLEETLEVER_EMAIL_FROM` before making email verification mandatory or relying on password-reset delivery.
7. Configure Google OAuth credentials only in Railway/Vercel secret stores. Never place them in source control or browser-exposed variables.

## Upload policy

- Evidence uploads are limited to 10 MB.
- Only PDF, JPEG, PNG, and WebP files are accepted.
- Extension, browser-declared MIME type, and binary signature must all agree.
- Files are stored under organization-scoped random keys in private object storage.
- Downloads require an active tenant session, are forced as attachments, and include `nosniff` plus a sandboxed content policy.

## Incident response minimum

1. Revoke affected sessions and rotate exposed credentials.
2. Preserve Railway, application, and audit-log evidence.
3. Identify affected organizations and records before remediation.
4. Restore only from a tested backup and record the recovery point.
5. Document impact, containment, cause, and follow-up controls.
