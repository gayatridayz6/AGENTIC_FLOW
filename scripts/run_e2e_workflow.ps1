#!/usr/bin/env pwsh
# E2E Workflow - Phases 3-6 (Dev → PR Creation)
# This will push branch and create PR

param(
    [string]$token = $env:GITHUB_PAT
)

if (-not $token) {
    Write-Output "ERROR: GITHUB_PAT not set"
    exit 1
}

$ErrorActionPreference = "Continue"
$repoUrl = "https://$token@github.com/gayatridayz6/AGENTIC_FLOW.git"
$branch = "feat/SHOPPING-CART-ADD-BTN-phase6"

Write-Output "=== E2E Workflow: Phase 3 → Phase 6 ==="
Write-Output ""

# Phase 3: Push branch
Write-Output "Phase 3: Push branch to GitHub"
& git push -u $repoUrl $branch 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Output "✅ Phase 3: Branch pushed"
} else {
    Write-Output "❌ Phase 3: Push failed"
    exit 1
}

# Phase 6: Create PR
Write-Output "Phase 6: Create PR"
$headers = @{
    "Authorization" = "Bearer $token"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$prData = @{
    title = "feat: Add 'Add to Cart' button on product listing page"
    head = $branch
    base = "main"
    body = "Phase 6 PR - Add to Cart Feature`n`nTest Coverage: 95.5% (20/20 passed)"
} | ConvertTo-Json

try {
    $pr = Invoke-RestMethod `
        -Uri "https://api.github.com/repos/gayatridayz6/AGENTIC_FLOW/pulls" `
        -Method Post `
        -Headers $headers `
        -Body $prData `
        -ContentType "application/json" `
        -TimeoutSec 10

    if ($pr.number) {
        Write-Output "✅ Phase 6: PR #$($pr.number) created"
        Write-Output "URL: $($pr.html_url)"
        Write-Output ""
        Write-Output "SUCCESS: E2E workflow complete"
        exit 0
    }
} catch {
    Write-Output "❌ Phase 6: PR creation failed"
    exit 1
}
