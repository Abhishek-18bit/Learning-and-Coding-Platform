$maxAttempts = if ($env:PRISMA_MIGRATE_MAX_ATTEMPTS) { [int]$env:PRISMA_MIGRATE_MAX_ATTEMPTS } else { 6 }
$baseDelayMs = if ($env:PRISMA_MIGRATE_RETRY_DELAY_MS) { [int]$env:PRISMA_MIGRATE_RETRY_DELAY_MS } else { 3000 }
$maxDelayMs = if ($env:PRISMA_MIGRATE_MAX_DELAY_MS) { [int]$env:PRISMA_MIGRATE_MAX_DELAY_MS } else { 20000 }
$isUpToDatePattern = 'up to date|No pending migrations|Database schema is up to date|All migrations have been applied'

for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    if ($attempt -gt 1) {
        Write-Host "[migrate-retry] Attempt $attempt/$maxAttempts" -ForegroundColor Yellow
    }

    $output = & npx prisma migrate deploy 2>&1
    $exitCode = $LASTEXITCODE
    $output | ForEach-Object { Write-Host $_ }

    if ($exitCode -eq 0) {
        exit 0
    }

    $combined = ($output | Out-String)
    $isRetryable = $combined -match 'P1002|P1001|advisory lock|database server was reached but timed out|Can''t reach database server'

    if (-not $isRetryable -or $attempt -eq $maxAttempts) {
        if ($isRetryable) {
            Write-Host "[migrate-retry] Failed after $maxAttempts attempts due to repeated transient DB lock/timeout." -ForegroundColor Yellow
            Write-Host "[migrate-retry] Checking migration status before failing..." -ForegroundColor Yellow

            $statusOutput = & npx prisma migrate status 2>&1
            $statusCode = $LASTEXITCODE
            $statusOutput | ForEach-Object { Write-Host $_ }
            $statusCombined = ($statusOutput | Out-String)

            if ($statusCode -eq 0 -and $statusCombined -match $isUpToDatePattern) {
                Write-Host "[migrate-retry] Schema already up to date. Continuing startup safely." -ForegroundColor Green
                exit 0
            }
        }

        exit $exitCode
    }

    $delayMs = [Math]::Min($baseDelayMs * $attempt, $maxDelayMs)
    $delaySec = [Math]::Round($delayMs / 1000, 1)
    Write-Host "[migrate-retry] Transient Prisma lock/timeout detected. Retrying in $delaySec seconds..." -ForegroundColor Yellow
    Start-Sleep -Milliseconds $delayMs
}

exit 1
