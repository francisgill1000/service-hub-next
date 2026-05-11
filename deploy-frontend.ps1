#!/usr/bin/env pwsh
# Build frontend, sync to frontend-build, commit and push.
# Usage: .\deploy-frontend.ps1 [-Message "optional commit message"]

param(
    [string]$Message = "Update frontend build"
)

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot
$frontend = Join-Path $repoRoot "frontend"
$out      = Join-Path $frontend "out"
$dest     = Join-Path $repoRoot "frontend-build"

Write-Host "==> Building frontend" -ForegroundColor Cyan
Push-Location $frontend
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed (exit $LASTEXITCODE)" }
} finally {
    Pop-Location
}

if (-not (Test-Path $out)) {
    throw "Build output not found at $out"
}

Write-Host "==> Syncing $out -> $dest" -ForegroundColor Cyan
# /MIR mirrors source (removes stale files); /XD .git keeps the destination repo intact
robocopy $out $dest /MIR /XD .git /NFL /NDL /NJH /NJS /NC /NS /NP
# Robocopy exit codes 0-7 are success; 8+ are real errors
if ($LASTEXITCODE -ge 8) { throw "robocopy failed (exit $LASTEXITCODE)" }

Write-Host "==> Committing and pushing" -ForegroundColor Cyan
Push-Location $dest
try {
    git add .
    $status = git status --porcelain
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Host "No changes to commit." -ForegroundColor Yellow
    } else {
        git commit -m $Message
        if ($LASTEXITCODE -ne 0) { throw "git commit failed (exit $LASTEXITCODE)" }
        git push
        if ($LASTEXITCODE -ne 0) { throw "git push failed (exit $LASTEXITCODE)" }
    }
} finally {
    Pop-Location
}

Write-Host "==> Done" -ForegroundColor Green
