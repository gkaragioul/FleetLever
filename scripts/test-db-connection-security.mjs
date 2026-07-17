import assert from "node:assert/strict";
import test from "node:test";

import { resolveDatabaseSsl } from "../src/lib/db/connection-security.mjs";

test("allows Railway private networking with encrypted transport", () => {
  assert.deepEqual(
    resolveDatabaseSsl({
      connectionString: "postgresql://fleetlever_app:secret@postgres.railway.internal:5432/railway",
      databaseSsl: "true",
      rejectUnauthorized: "false",
      hostedDeployment: true,
    }),
    { rejectUnauthorized: false },
  );
});

test("requires certificate verification for public production database endpoints", () => {
  assert.deepEqual(
    resolveDatabaseSsl({
      connectionString: "postgresql://fleetlever_app:secret@proxy.example.com:5432/fleetlever",
      databaseSsl: "true",
      rejectUnauthorized: "true",
      hostedDeployment: true,
    }),
    { rejectUnauthorized: true },
  );
  assert.throws(
    () =>
      resolveDatabaseSsl({
        connectionString: "postgresql://fleetlever_app:secret@proxy.example.com:5432/fleetlever",
        databaseSsl: "true",
        rejectUnauthorized: "false",
        hostedDeployment: true,
      }),
    /certificate verification/i,
  );
  assert.throws(
    () =>
      resolveDatabaseSsl({
        connectionString: "postgresql://fleetlever_app:secret@proxy.example.com:5432/fleetlever",
        databaseSsl: "false",
        rejectUnauthorized: "false",
        hostedDeployment: true,
      }),
    /encrypted database transport/i,
  );
});

test("keeps local development flexible", () => {
  assert.equal(
    resolveDatabaseSsl({
      connectionString: "postgresql://postgres:postgres@127.0.0.1:5432/fleetlever",
      databaseSsl: "false",
      rejectUnauthorized: "false",
      hostedDeployment: false,
    }),
    false,
  );
});
