$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = Join-Path $projectRoot 'backend\venv\Scripts\python.exe'
$frontendDir = Join-Path $projectRoot 'frontend'

if (-not (Test-Path -LiteralPath $pythonExe)) {
    throw "Backend environment is missing. Follow the README setup once, then run this script again."
}

$apiUp = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if (-not $apiUp) {
    Start-Process -FilePath $pythonExe `
        -ArgumentList '-m','uvicorn','backend.app.main:app','--host','0.0.0.0','--port','8000' `
        -WorkingDirectory $projectRoot -WindowStyle Hidden | Out-Null
}

$webUp = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $webUp) {
    Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' `
        -WorkingDirectory $frontendDir -WindowStyle Hidden | Out-Null
}

$deadline = (Get-Date).AddSeconds(45)
do {
    try {
        $health = Invoke-RestMethod 'http://127.0.0.1:8000/health' -TimeoutSec 2
        $site = Invoke-WebRequest 'http://127.0.0.1:5173/' -UseBasicParsing -TimeoutSec 2
        if ($health.status -eq 'healthy' -and $site.StatusCode -eq 200) {
            Write-Host 'CraftLink is ready: http://localhost:5173/' -ForegroundColor Green
            exit 0
        }
    } catch {
        Start-Sleep -Milliseconds 750
    }
} while ((Get-Date) -lt $deadline)

throw 'CraftLink did not become ready within 45 seconds. Check the backend and frontend logs.'
