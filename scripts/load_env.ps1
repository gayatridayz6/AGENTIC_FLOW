#!/usr/bin/env pwsh
# Loads KEY=VALUE pairs from the repo-root .env into the current process environment.
# Usage: . "$PSScriptRoot\load_env.ps1"

$envFile = Join-Path (Split-Path -Parent $PSScriptRoot) ".env"

if (-not (Test-Path $envFile)) {
    Write-Warning ".env not found at $envFile (copy .env.example to .env and fill in values)"
    return
}

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $key, $value = $line.Split("=", 2)
        [Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim().Trim('"').Trim("'"), "Process")
    }
}
