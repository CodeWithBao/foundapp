$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $projectRoot '.dev-runtime'

New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
Push-Location $projectRoot
try {
    Write-Host '[1/6] Checking Git diff...' -ForegroundColor Cyan
    & git diff --check
    if ($LASTEXITCODE -ne 0) { throw 'git diff --check failed.' }

    Write-Host '[2/6] Running protected-file and secret hook...' -ForegroundColor Cyan
    & git hook run pre-commit
    if ($LASTEXITCODE -ne 0) { throw 'Pre-commit security hook failed.' }

    Write-Host '[3/6] Running frontend lint...' -ForegroundColor Cyan
    & npm run lint
    if ($LASTEXITCODE -ne 0) { throw 'Frontend lint failed.' }

    Write-Host '[4/6] Building frontend...' -ForegroundColor Cyan
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }

    Write-Host '[5/6] Running backend tests...' -ForegroundColor Cyan
    Push-Location (Join-Path $projectRoot 'backend')
    try {
        & go test ./...
        if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed.' }
    } finally {
        Pop-Location
    }

    Write-Host '[6/6] Building backend...' -ForegroundColor Cyan
    Push-Location (Join-Path $projectRoot 'backend')
    try {
        & go build -o (Join-Path $runtimeDir 'unifind-server-check.exe') ./cmd/server
        if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }
    } finally {
        Pop-Location
    }

    Write-Host '[OK] Verification completed. Nothing was deployed.' -ForegroundColor Green
} finally {
    Pop-Location
}
