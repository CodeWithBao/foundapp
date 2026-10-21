$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $projectRoot '.dev-runtime'
$statusPath = Join-Path $runtimeDir 'status.json'

if (-not (Test-Path $statusPath)) {
    Write-Host "[OFFLINE] No development runtime status was found. Run 'npm run dev:public'." -ForegroundColor Yellow
    exit 1
}

$status = Get-Content -LiteralPath $statusPath -Raw | ConvertFrom-Json
$failed = $false

function Test-Health {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$TimeoutSeconds = 20
    )

    try {
        $result = Invoke-RestMethod -Uri $Url -TimeoutSec $TimeoutSeconds
        if ($result.status -eq 'ok' -and $result.db -eq 'ok') {
            Write-Host "[OK] $Name -> status=ok, db=ok" -ForegroundColor Green
            return $true
        }
        Write-Host "[FAIL] $Name did not return status=ok and db=ok" -ForegroundColor Red
    } catch {
        Write-Host "[FAIL] $Name -> $($_.Exception.Message)" -ForegroundColor Red
    }
    return $false
}

Write-Host '===================================================' -ForegroundColor Cyan
Write-Host ' UniFind DNTU - Environment Status' -ForegroundColor Cyan
Write-Host '===================================================' -ForegroundColor Cyan
Write-Host "Branch      : $($status.branch)"
Write-Host "DEV public  : $($status.publicUrl)"
Write-Host "DEV database: $($status.database)"
Write-Host "Production  : $($status.productionUrl)"
Write-Host ''

if (-not (Test-Health 'Local development backend' 'http://127.0.0.1:8080/health')) { $failed = $true }
if (-not (Test-Health 'Public development tunnel' "$($status.publicUrl)/api/health" 30)) { $failed = $true }
if (-not (Test-Health 'Production Cloudflare -> Render -> Supabase' 'https://unifind-dntu.pages.dev/api/health' 45)) { $failed = $true }
if (-not (Test-Health 'Production Render -> Supabase' 'https://unifind-dntu-backend.onrender.com/health' 60)) { $failed = $true }

if ($failed) {
    exit 1
}

Write-Host ''
Write-Host '[OK] DEV and PRODUCTION are healthy and use separate runtime paths.' -ForegroundColor Green
