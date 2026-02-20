Write-Host "Cleaning up old server processes..." -ForegroundColor Yellow

# Find and kill processes using port 5000
$portProcesses = netstat -ano | Select-String ":5000" | ForEach-Object {
    if ($_ -match '\s+(\d+)\s*$') {
        $matches[1]
    }
} | Select-Object -Unique

if ($portProcesses) {
    foreach ($processId in $portProcesses) {
        Write-Host "   Killing process $processId..." -ForegroundColor Cyan
        taskkill /F /PID $processId 2>$null | Out-Null
    }
    Start-Sleep -Seconds 2
}

# --- CRITICAL FIX: MANUALLY LOAD .ENV INTO ENVIRONMENT ---
Write-Host "Loading .env variables..." -ForegroundColor Gray
$envFile = Get-Content ".env"
foreach ($line in $envFile) {
    if ($line -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $value = $value -replace '^["'']|["'']$', ''
        
        # Set using $env: to ensure it's available to child processes
        $tempKey = $key
        Set-Item -Path "Env:$tempKey" -Value $value
        
        if ($key -eq "DATABASE_URL") {
            $masked = $value -replace ':.*@', ':****@'
            Write-Host "   Set $key to $masked" -ForegroundColor Gray
        } else {
            Write-Host "   Set $key" -ForegroundColor Gray
        }
    }
}

Write-Host "Port 5000 is free and environment is loaded!" -ForegroundColor Green
Write-Host "Starting server..." -ForegroundColor Blue

npm run dev
