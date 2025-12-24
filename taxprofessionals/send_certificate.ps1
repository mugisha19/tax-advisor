# Send Certificate Script
# Generates real PDF certificate and sends email to applicant

Write-Host "`n=== Certificate Generation & Email Sending ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = if ($env:API_BASE_URL) { $env:API_BASE_URL } else { "https://tpms.rra.gov.rw" }
$tpin = if ($env:TEST_TPIN) { $env:TEST_TPIN } else { "100602866-1" }
$adminUsername = if ($env:ADMIN_USERNAME) { $env:ADMIN_USERNAME } else { "mugisha" }
$adminPassword = if ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "Mugisha1234!@" }

# Step 1: Login as admin
Write-Host "1. Logging in as admin..." -ForegroundColor Yellow
try {
    $loginBody = @{
        username = $adminUsername
        password = $adminPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $loginResponse.data.token
    Write-Host "   ✅ Login successful!" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Please check admin credentials in application.properties" -ForegroundColor Yellow
    exit 1
}

# Step 2: Generate certificate and send email
Write-Host "`n2. Generating certificate and sending email..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/regenerate-certificate/$tpin" `
        -Method POST `
        -Headers $headers

    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   Message: $($response.message)" -ForegroundColor White
    Write-Host "   Details: $($response.data)" -ForegroundColor Gray
    
    Write-Host "`n=== Certificate Generated Successfully! ===" -ForegroundColor Green
    Write-Host "📧 Email sent to: Mugisha Liad" -ForegroundColor Cyan
    Write-Host "📄 Certificate saved in database" -ForegroundColor Cyan
    
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get more details from the error response
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($errorJson.message)" -ForegroundColor Yellow
    }
}

Write-Host ""

