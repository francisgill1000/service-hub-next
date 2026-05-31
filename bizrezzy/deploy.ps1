#!/usr/bin/env pwsh
# Build bizrezzy and deploy the static SPA to bizrezzy.eloquentservice.com.
# Mirrors the rezzy-customer static-SPA serving model on the shared droplet.
# Usage: ./deploy.ps1

$ErrorActionPreference = "Stop"
$root   = $PSScriptRoot
$server = "root@64.227.153.90"
$webroot = "/var/www/bizrezzy"

Write-Host "==> Building" -ForegroundColor Cyan
Push-Location $root
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed (exit $LASTEXITCODE)" }
} finally {
    Pop-Location
}

$dist = Join-Path $root "dist"
if (-not (Test-Path $dist)) { throw "Build output not found at $dist" }

Write-Host "==> Uploading dist -> $server`:$webroot" -ForegroundColor Cyan
ssh -o BatchMode=yes $server "mkdir -p $webroot && rm -rf $webroot/*"
if ($LASTEXITCODE -ne 0) { throw "remote prepare failed" }
scp -q -o BatchMode=yes -r "$dist/*" "$server`:$webroot/"
if ($LASTEXITCODE -ne 0) { throw "scp failed" }
ssh -o BatchMode=yes $server "chown -R www-data:www-data $webroot"

Write-Host "==> Verifying" -ForegroundColor Cyan
curl.exe -sI https://bizrezzy.eloquentservice.com/ | Select-Object -First 1

Write-Host "==> Done — https://bizrezzy.eloquentservice.com" -ForegroundColor Green
