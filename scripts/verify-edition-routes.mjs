import process from "node:process";

const matrix = {
  elliniko: {
    port: 3000,
    ok: ["/main-page", "/fleet-management", "/civic-dispatch"],
    forbidden: [],
  },
  console: {
    port: 3001,
    ok: ["/", "/fleet-management", "/login"],
    forbidden: ["/main-page", "/civic-dispatch"],
  },
  site: {
    port: 3002,
    ok: ["/", "/landing", "/pricing"],
    forbidden: ["/main-page", "/fleet-management", "/civic-dispatch"],
  },
};

const failures = [];

async function request(url, options) {
  try {
    return await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000), ...options });
  } catch (error) {
    failures.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

for (const [edition, expectation] of Object.entries(matrix)) {
  const origin = `http://127.0.0.1:${expectation.port}`;

  for (const pathname of expectation.ok) {
    const response = await request(`${origin}${pathname}`);
    if (response && response.status >= 400) failures.push(`${edition} ${pathname}: expected available, received ${response.status}`);
  }

  for (const pathname of expectation.forbidden) {
    const response = await request(`${origin}${pathname}`);
    if (response && response.status !== 404) failures.push(`${edition} ${pathname}: expected 404, received ${response.status}`);
  }

  const health = await request(`${origin}/api/health`);
  if (!health) continue;

  const body = await health.json().catch(() => null);
  if (body?.edition !== edition) failures.push(`${edition} health: expected edition ${edition}, received ${body?.edition ?? "missing"}`);
  if (edition === "site" && health.status !== 200) failures.push(`site health: expected 200, received ${health.status}`);
}

if (failures.length > 0) {
  console.error(`FAIL edition route matrix\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("PASS edition route matrix");
