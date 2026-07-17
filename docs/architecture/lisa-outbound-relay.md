# Lisa outbound relay

Lisa can use the authenticated Codex CLI on an always-on workstation without exposing that workstation to inbound internet traffic.

## Request path

1. An authenticated FleetLever user sends a question to the hosted console.
2. The hosted app creates a short-lived, tenant-scoped relay job in PostgreSQL.
3. The workstation companion polls the hosted HTTPS relay endpoints using a shared bearer secret.
4. The companion sends the job to its localhost-only Codex bridge.
5. Sanitized status and message events are written back to the hosted relay and streamed to the browser.
6. Questions and context are scrubbed when the job finishes, fails, is cancelled, or expires.

No Codex credentials, browser cookies, or local ports leave the workstation.

## Hosted application variables

```text
FLEETLEVER_LISA_ENABLED=true
FLEETLEVER_LISA_RELAY_ENABLED=true
FLEETLEVER_LISA_RELAY_SECRET=<at least 32 random characters>
FLEETLEVER_LISA_RELAY_COMPANION_ID=primary
```

Do not set `FLEETLEVER_LISA_RELAY_URL` on the hosted application. The hosted application is the relay server.

## Workstation companion variables

```text
FLEETLEVER_LISA_LOCAL_BRIDGE_ENABLED=true
FLEETLEVER_LISA_BRIDGE_SECRET=<separate local secret>
FLEETLEVER_LISA_RELAY_ENABLED=true
FLEETLEVER_LISA_RELAY_URL=https://fleetlever-app-production.up.railway.app
FLEETLEVER_LISA_RELAY_SECRET=<same relay secret as the hosted app>
FLEETLEVER_LISA_RELAY_COMPANION_ID=primary
```

Start the companion with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\start-lisa-companion.ps1
```

The runner reads `%APPDATA%\FleetLever\lisa-companion.env` by default and accepts only the documented Lisa variables. The process still binds its direct bridge to `127.0.0.1`. Relay mode adds only outbound HTTPS requests.

## Operational limits

- Relay jobs expire after ten minutes.
- The hosted stream stops after 95 seconds if the companion does not finish.
- A heartbeat older than 30 seconds is shown as disconnected.
- Only `status`, `message`, `error`, and `done` event types are accepted.
- The shared relay secret must be rotated if the workstation or its environment file is compromised.
