[CmdletBinding()]
param(
  [string]$ConfigPath = (Join-Path $env:APPDATA "FleetLever\lisa-companion.env")
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$allowedVariables = @(
  "CODEX_BIN",
  "FLEETLEVER_LISA_LOCAL_BRIDGE_ENABLED",
  "FLEETLEVER_LISA_BRIDGE_SECRET",
  "FLEETLEVER_LISA_BRIDGE_HOST",
  "FLEETLEVER_LISA_BRIDGE_PORT",
  "FLEETLEVER_LISA_TIMEOUT_MS",
  "FLEETLEVER_LISA_RELAY_ENABLED",
  "FLEETLEVER_LISA_RELAY_URL",
  "FLEETLEVER_LISA_RELAY_SECRET",
  "FLEETLEVER_LISA_RELAY_COMPANION_ID"
)

if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
  throw "Lisa companion configuration was not found at $ConfigPath."
}

foreach ($line in Get-Content -LiteralPath $ConfigPath) {
  $trimmed = $line.Trim()
  if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }

  $parts = $trimmed.Split("=", 2)
  if ($parts.Count -ne 2) { throw "Invalid Lisa companion configuration line." }

  $name = $parts[0].Trim()
  $value = $parts[1].Trim()
  if ($allowedVariables -notcontains $name) { throw "Unsupported Lisa companion variable: $name" }

  [Environment]::SetEnvironmentVariable($name, $value, "Process")
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repositoryRoot
& node (Join-Path $PSScriptRoot "lisa-bridge.mjs")
exit $LASTEXITCODE
