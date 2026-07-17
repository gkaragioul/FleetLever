function isPrivateDatabaseHost(hostname) {
  const normalized = hostname.toLowerCase();
  return normalized.endsWith(".railway.internal") || normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

export function resolveDatabaseSsl({
  connectionString,
  databaseSsl,
  rejectUnauthorized,
  hostedDeployment,
}) {
  let hostname = "";
  try {
    hostname = new URL(connectionString).hostname;
  } catch {
    if (hostedDeployment) throw new Error("DATABASE_URL is not a valid database connection URL.");
  }

  const sslEnabled = databaseSsl !== "false";
  const verifyCertificate = rejectUnauthorized === "true";
  const privateHost = isPrivateDatabaseHost(hostname);

  if (hostedDeployment && !privateHost && !sslEnabled) {
    throw new Error("Public production databases require encrypted database transport.");
  }
  if (hostedDeployment && !privateHost && !verifyCertificate) {
    throw new Error("Public production databases require TLS certificate verification.");
  }

  return sslEnabled ? { rejectUnauthorized: verifyCertificate } : false;
}
