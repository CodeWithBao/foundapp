$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

param(
    [switch]$OpenBrowser
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot 'backend'
$runtimeDir = Join-Path $projectRoot '.dev-runtime'
$stopScript = Join-Path $PSScriptRoot 'stop-dev.ps1'

function Test-RequiredCommand {
    param([Parameter(Mandatory = $true)][string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' is not installed or is not available in PATH."
    }
}

function Assert-PortIsFree {
    param([Parameter(Mandatory = $true)][int]$Port)

    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    if ($listener) {
        throw "Port $Port is already in use. Run 'npm run dev:stop' or stop the existing process first."
    }
}

function Wait-HttpOk {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$Attempts = 40,
        [int]$DelaySeconds = 1
    )

    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                return $response
            }
        } catch {
            if ($attempt -eq $Attempts) {
                throw
            }
        }
        Start-Sleep -Seconds $DelaySeconds
    }

    throw "Timed out while waiting for $Url"
}

function Write-PidFile {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][System.Diagnostics.Process]$Process
    )

    Set-Content -LiteralPath (Join-Path $runtimeDir "$Name.pid") -Value $Process.Id -Encoding ASCII
}

function Escape-SingleQuotedPowerShellString {
    param([Parameter(Mandatory = $true)][string]$Value)
    return $Value.Replace("'", "''")
}

Push-Location $projectRoot
try {
    Write-Host '===================================================' -ForegroundColor Cyan
    Write-Host ' UniFind DNTU - Isolated Public Development' -ForegroundColor Cyan
    Write-Host '===================================================' -ForegroundColor Cyan

    Test-RequiredCommand 'git'
    Test-RequiredCommand 'go'
    Test-RequiredCommand 'node'
    Test-RequiredCommand 'npm'
    Test-RequiredCommand 'ssh'

    $branch = (& git branch --show-current).Trim()
    if (-not $branch) {
        throw 'Cannot determine the current Git branch.'
    }
    if ($branch -eq 'main') {
        throw "Development is blocked on branch 'main'. Switch to develop, feature/*, fix/*, chore/*, or another non-production branch."
    }

    if (Test-Path $runtimeDir) {
        & $stopScript -Quiet
    }
    New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null

    Assert-PortIsFree 8080
    Assert-PortIsFree 5173

    if (-not (Test-Path (Join-Path $projectRoot 'node_modules'))) {
        Write-Host '[SETUP] Installing frontend dependencies with npm ci...' -ForegroundColor Yellow
        & npm ci
        if ($LASTEXITCODE -ne 0) {
            throw 'npm ci failed.'
        }
    }

    $safeProjectRoot = Escape-SingleQuotedPowerShellString $projectRoot
    $safeBackendRoot = Escape-SingleQuotedPowerShellString $backendRoot
    $backendRunnerPath = Join-Path $runtimeDir 'run-backend.ps1'
    $frontendRunnerPath = Join-Path $runtimeDir 'run-frontend.ps1'
    $tunnelRunnerPath = Join-Path $runtimeDir 'run-tunnel.ps1'

    @"
`$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath '$safeBackendRoot'
`$env:PORT = '8080'
`$env:DB_DRIVER = 'sqlite'
`$env:DATABASE_URL = 'unifind-dev.db'
`$env:ALLOW_SQLITE_FALLBACK = 'true'
`$env:GIN_MODE = 'debug'
`$env:PROXY_SECURITY_ENABLED = 'false'
`$env:ORIGIN_PROXY_SECRET = ''
`$env:JWT_SECRET = 'unifind-local-development-only-jwt-secret'
& go run ./cmd/server
exit `$LASTEXITCODE
"@ | Set-Content -LiteralPath $backendRunnerPath -Encoding UTF8

    @"
`$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath '$safeProjectRoot'
`$env:VITE_API_BASE_URL = '/api/v1'
`$env:VITE_API_URL = '/api/v1'
# A known demo value intentionally disables Google OAuth on temporary tunnel origins.
`$env:VITE_GOOGLE_CLIENT_ID = '1081395892804-demo.apps.googleusercontent.com'
& npm run dev -- --host 0.0.0.0 --port 5173
exit `$LASTEXITCODE
"@ | Set-Content -LiteralPath $frontendRunnerPath -Encoding UTF8

    @"
`$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath '$safeProjectRoot'
& ssh -T -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -R 80:127.0.0.1:5173 serveo.net
exit `$LASTEXITCODE
"@ | Set-Content -LiteralPath $tunnelRunnerPath -Encoding UTF8

    Write-Host '[1/3] Starting local Go backend with isolated SQLite...' -ForegroundColor Yellow
    $backendProcess = Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $backendRunnerPath `
        -WorkingDirectory $backendRoot `
        -RedirectStandardOutput (Join-Path $runtimeDir 'backend.log') `
        -RedirectStandardError (Join-Path $runtimeDir 'backend-error.log') `
        -WindowStyle Hidden `
        -PassThru
    Write-PidFile 'backend' $backendProcess

    $backendHealth = Wait-HttpOk 'http://127.0.0.1:8080/health' -Attempts 60
    $backendHealthData = $backendHealth.Content | ConvertFrom-Json
    if ($backendHealthData.status -ne 'ok' -or $backendHealthData.db -ne 'ok') {
        throw 'Local backend health check did not report status=ok and db=ok.'
    }

    Write-Host '[2/3] Starting Vite on port 5173...' -ForegroundColor Yellow
    $frontendProcess = Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $frontendRunnerPath `
        -WorkingDirectory $projectRoot `
        -RedirectStandardOutput (Join-Path $runtimeDir 'frontend.log') `
        -RedirectStandardError (Join-Path $runtimeDir 'frontend-error.log') `
        -WindowStyle Hidden `
        -PassThru
    Write-PidFile 'frontend' $frontendProcess
    Wait-HttpOk 'http://127.0.0.1:5173/' -Attempts 40 | Out-Null

    Write-Host '[3/3] Opening temporary HTTPS tunnel...' -ForegroundColor Yellow
    $tunnelProcess = Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $tunnelRunnerPath `
        -WorkingDirectory $projectRoot `
        -RedirectStandardOutput (Join-Path $runtimeDir 'tunnel.log') `
        -RedirectStandardError (Join-Path $runtimeDir 'tunnel-error.log') `
        -WindowStyle Hidden `
        -PassThru
    Write-PidFile 'tunnel' $tunnelProcess

    $publicUrl = $null
    for ($attempt = 1; $attempt -le 40; $attempt++) {
        $tunnelOutput = ''
        foreach ($logName in @('tunnel.log', 'tunnel-error.log')) {
            $logPath = Join-Path $runtimeDir $logName
            if (Test-Path $logPath) {
                $tunnelOutput += Get-Content -LiteralPath $logPath -Raw
            }
        }

        $match = [regex]::Match($tunnelOutput, 'https://[a-zA-Z0-9.-]+\.serveousercontent\.com')
        if ($match.Success) {
            $publicUrl = $match.Value
            break
        }

        if ($tunnelProcess.HasExited) {
            throw 'The tunnel process exited before publishing a URL. Review .dev-runtime/tunnel-error.log.'
        }
        Start-Sleep -Seconds 1
    }

    if (-not $publicUrl) {
        throw 'Timed out while waiting for the public development URL.'
    }

    Wait-HttpOk "$publicUrl/api/health" -Attempts 30 -DelaySeconds 2 | Out-Null

    $commit = (& git rev-parse HEAD).Trim()
    $status = [ordered]@{
        environment = 'development'
        database = 'backend/unifind-dev.db (SQLite local)'
        branch = $branch
        commit = $commit
        localUrl = 'http://localhost:5173'
        publicUrl = $publicUrl
        backendHealth = 'http://localhost:8080/health'
        productionUrl = 'https://unifind-dntu.pages.dev'
        startedAt = (Get-Date).ToString('o')
    }
    $status | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtimeDir 'status.json') -Encoding UTF8

    Write-Host ''
    Write-Host '[READY] Development environment is public.' -ForegroundColor Green
    Write-Host "Public DEV : $publicUrl" -ForegroundColor Green
    Write-Host 'Local DEV  : http://localhost:5173' -ForegroundColor Green
    Write-Host 'Database   : backend/unifind-dev.db (SQLite local only)' -ForegroundColor Green
    Write-Host 'Production : https://unifind-dntu.pages.dev (not modified)' -ForegroundColor Cyan
    Write-Host "Git branch : $branch" -ForegroundColor Cyan
    Write-Host ''
    Write-Host "Stop safely with: npm run dev:stop" -ForegroundColor Yellow

    if ($OpenBrowser) {
        Start-Process $publicUrl
    }
} catch {
    Write-Host "[FAILED] $($_.Exception.Message)" -ForegroundColor Red
    if (Test-Path $stopScript) {
        & $stopScript -Quiet
    }
    exit 1
} finally {
    Pop-Location
}
