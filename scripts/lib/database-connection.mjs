import { resolveDatabaseSsl } from "../../src/lib/db/connection-security.mjs";

export function databaseSsl(connectionString) {
  return resolveDatabaseSsl({
    connectionString,
    databaseSsl: process.env.DATABASE_SSL,
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
    hostedDeployment: process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.VERCEL),
  });
}
