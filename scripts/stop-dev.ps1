param(
    [switch]$Quiet
)

$ErrorActionPreference = 'Continue'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $projectRoot '.dev-runtime'

if (-not $Quiet) {
    Write-Host 'Stopping isolated UniFind development processes...' -ForegroundColor Yellow
}

foreach ($name in @('tunnel', 'frontend', 'backend')) {
    $pidPath = Join-Path $runtimeDir "$name.pid"
    if (-not (Test-Path $pidPath)) {
        continue
    }

    $recordedPid = (Get-Content -LiteralPath $pidPath -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($recordedPid -and $recordedPid -match '^\d+$') {
        $process = Get-Process -Id ([int]$recordedPid) -ErrorAction SilentlyContinue
        if ($process) {
            & taskkill.exe /PID $recordedPid /T /F 2>$null | Out-Null
        }
    }
    Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue
}

Remove-Item -LiteralPath (Join-Path $runtimeDir 'status.json') -Force -ErrorAction SilentlyContinue

if (-not $Quiet) {
    Write-Host '[OK] Local backend, Vite, and tunnel were stopped.' -ForegroundColor Green
    Write-Host 'Cloudflare Pages, Render, and Supabase production were not touched.' -ForegroundColor Cyan
}
