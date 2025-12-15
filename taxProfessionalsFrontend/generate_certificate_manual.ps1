# Manual Certificate Generation Script
# This creates a dummy certificate and updates the database

Write-Host "=== Manual Certificate Generator ===" -ForegroundColor Cyan
Write-Host ""

# Create uploads directory structure
$uploadDir = ".\uploads\certificates\100602866-1"
$certPath = "$uploadDir\approval_certificate.pdf"

Write-Host "1. Creating directory: $uploadDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $uploadDir | Out-Null

# Create a simple text file as a placeholder PDF
$content = @"
CERTIFICATE OF APPROVAL

Tax Professional Registration

Name: Mugisha Liad
TPIN: 100602866-1
Status: APPROVED

This is a placeholder certificate.
Please use the proper certificate generation endpoint to create the official certificate.

Date: $(Get-Date -Format "dd/MM/yyyy")
"@

Write-Host "2. Creating placeholder certificate: $certPath" -ForegroundColor Yellow
$content | Out-File -FilePath $certPath -Encoding UTF8

Write-Host "3. File created successfully!" -ForegroundColor Green
Write-Host "   Size: $((Get-Item $certPath).Length) bytes" -ForegroundColor Gray

# Generate SQL update command
$relativePath = "certificates/100602866-1/approval_certificate.pdf"
$sqlUpdate = @"

-- SQL to update the database:
UPDATE tax_professionals 
SET certificate_file_path = '$relativePath'
WHERE tpin = '100602866-1';

-- Verify the update:
SELECT tpin, full_name, status, certificate_file_path 
FROM tax_professionals 
WHERE tpin = '100602866-1';
"@

Write-Host ""
Write-Host "4. Now run this SQL in PostgreSQL:" -ForegroundColor Cyan
Write-Host $sqlUpdate -ForegroundColor Yellow
Write-Host ""
Write-Host "5. After running the SQL, try downloading the certificate again!" -ForegroundColor Green
Write-Host ""

