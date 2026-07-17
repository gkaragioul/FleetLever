# FleetLever Production Operations

## Runtime boundary

- `fleetlever.com` is the commercial website.
- The Railway `fleetlever-app` service runs the authenticated console.
- The Railway `fleetlever-site` service provides the commercial deployment origin.
- Railway Postgres stores accounts, sessions, tenant membership, audit history, console state, and operational data.
- Railway object storage holds uploaded evidence and branding assets.

The public `/api/health` response intentionally exposes only service identity and component states. Database identity, tenant IDs, bucket details, schema names, and migration history must remain private.

## Recovery policy

Postgres has two independent recovery layers:

1. Point-in-time recovery archives WAL continuously.
2. A daily volume backup runs at `07:37 UTC` with six days of retention.

Keep both enabled. A volume backup protects the volume as a unit; PITR supports recovery to a specific transaction time.

## Verified restore drill

The first production restore drill completed on 2026-07-17.

- Recovery target: `2026-07-17 15:45:00 UTC`
- Restore mode: isolated sibling Postgres service
- Last transaction restored: `2026-07-17 15:44:59.928135 UTC`
- Result: promoted successfully and accepted read/write connections
- Schema check: 42 public tables present
- Migration check: 10 migrations present, latest `0010_auth_security_phase2`
- Tenant check: 2 organizations and 4 profiles present at the target time
- Cleanup: temporary restore service deleted after validation

Railway PITR restores must always be created as sibling services first. Do not point the application at a restored service until schema, row counts, authentication tables, and a read-only application smoke test have passed.

## Restore procedure

1. Record the incident start and the desired UTC recovery time.
2. Create a PITR sibling from the production Postgres volume.
3. Wait for `database system is ready to accept connections` and confirm that recovery stopped at the requested timestamp.
4. Connect using the sibling service's public database URL from a trusted workstation.
5. Verify `schema_migrations`, organizations, profiles, assets, documents, and authentication table counts.
6. Run application read checks against a temporary deployment or maintenance environment.
7. Only after approval, switch application database references or perform a controlled data recovery.
8. Retain incident evidence, then delete the temporary sibling when it is no longer required.

## Deploy checks

Every code change must pass:

- dependency audit
- lint
- authentication tests
- security and tenant-isolation tests
- edition boundary checks
- commercial and customization contracts
- production build

After deployment, run `npm run test:production-boundaries`. It verifies both health endpoints, the unauthenticated console redirect, login availability, and the commercial site.

## Account security

- Passwords are stored as salted scrypt hashes in the private database schema.
- Browser sessions use opaque random tokens; only token hashes are stored in Postgres.
- Session cookies are `HttpOnly`, `Secure` on hosted deployments, and `SameSite=Lax`.
- Login, signup, password reset, and token consumption are rate limited in Postgres.
- Tenant tables enforce row-level security and active membership.
- Password-reset and verification tokens are hashed, expiring, and single use.
- Audit logs are append-only to the restricted runtime role.
- Uploads enforce size, extension, MIME type, and file-signature checks.

## Required external configuration

The following integrations need provider-owned credentials before they can be treated as production-ready:

- `RESEND_API_KEY` and `FLEETLEVER_EMAIL_FROM` for verification and password-reset delivery
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google sign-in

Do not place these values in Git, screenshots, support messages, or documentation. Store them only as Railway service variables and rotate them after suspected exposure.

## Monitoring response

Monitor the app and site health endpoints at least once per minute. Alert after two consecutive failures and include the affected component states. For an app failure:

1. Check the latest Railway deployment and application logs.
2. Confirm Postgres is reachable and the volume is mounted.
3. Confirm object storage variables are present.
4. Confirm the configured default tenant remains active.
5. Roll back the application deployment when the failure follows a release.
6. Use PITR only for confirmed data corruption or destructive database events, not ordinary application errors.
