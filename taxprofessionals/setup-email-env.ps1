# RRA Tax Professionals - Email Setup Script (Simple Version)

Clear-Host

Write-Host "============================================================"
Write-Host "  RRA Tax Professionals - Email Setup Wizard"
Write-Host "============================================================"
Write-Host ""

# Instructions
Write-Host "STEP 1: Get Gmail App Password" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://myaccount.google.com/security"
Write-Host "2. Enable 2-Step Verification"
Write-Host "3. Click App passwords"
Write-Host "4. Generate password for Mail > Other"
Write-Host "5. Copy the 16-character password"
Write-Host ""
Write-Host "IMPORTANT: Use the App Password, NOT your regular Gmail password!"
Write-Host ""

$ready = Read-Host "Ready to continue? (Y/N)"
if ($ready -ne 'Y' -and $ready -ne 'y') {
    Write-Host "Setup cancelled."
    exit
}

Write-Host ""
Write-Host "============================================================"
Write-Host "STEP 2: Enter Your Credentials" -ForegroundColor Yellow
Write-Host "============================================================"
Write-Host ""

# Get email
$mailUsername = Read-Host "Enter your Gmail address"
Write-Host "Got it: $mailUsername"
Write-Host ""

# Get password
$mailPassword = Read-Host "Enter your 16-character App Password"
$cleanPassword = $mailPassword -replace '\s', ''
Write-Host "Password length: $($cleanPassword.Length) characters"
Write-Host ""

# Email mode
Write-Host "Email mode:"
Write-Host "  [1] REAL EMAILS"
Write-Host "  [2] MOCK EMAILS (console only)"
Write-Host ""
$mode = Read-Host "Choose (1 or 2)"
$emailMockEnabled = if ($mode -eq '1') { 'false' } else { 'true' }

Write-Host ""
Write-Host "============================================================"
Write-Host "STEP 3: Setting Variables" -ForegroundColor Yellow
Write-Host "============================================================"
Write-Host ""

# Set current session
$env:MAIL_USERNAME = $mailUsername
$env:MAIL_PASSWORD = $cleanPassword
$env:EMAIL_MOCK_ENABLED = $emailMockEnabled

Write-Host "Variables set for current session:"
Write-Host "  MAIL_USERNAME = $mailUsername"
Write-Host "  MAIL_PASSWORD = ******* (hidden)"
Write-Host "  EMAIL_MOCK_ENABLED = $emailMockEnabled"
Write-Host ""

# Ask for permanent
$setPermanent = Read-Host "Set permanently? (Y/N)"

if ($setPermanent -eq 'Y' -or $setPermanent -eq 'y') {
    [Environment]::SetEnvironmentVariable('MAIL_USERNAME', $mailUsername, 'User')
    [Environment]::SetEnvironmentVariable('MAIL_PASSWORD', $cleanPassword, 'User')
    [Environment]::SetEnvironmentVariable('EMAIL_MOCK_ENABLED', $emailMockEnabled, 'User')
    
    Write-Host ""
    Write-Host "Variables set permanently!"
    Write-Host "Restart your IDE for changes to take effect."
}

Write-Host ""
Write-Host "============================================================"
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================================"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Restart your IDE"
Write-Host "  2. Run your Spring Boot application"
Write-Host "  3. Check the logs"
Write-Host ""
Write-Host "To verify, run: echo `$env:MAIL_USERNAME"
Write-Host ""

pause