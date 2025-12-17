# Run Database Migration for Rejection Letter Columns
# This script adds the missing columns to the PostgreSQL database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DATABASE MIGRATION - Rejection Letter Columns" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL connection details (from environment or defaults)
$PGHOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$PGPORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$PGDATABASE = if ($env:DB_NAME) { $env:DB_NAME } else { "taxpayer_db_backup" }
$PGUSER = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "postgres" }
$PGPASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "mugisha1234!@" }

Write-Host "Connecting to PostgreSQL..." -ForegroundColor Yellow
Write-Host "  Host: $PGHOST" -ForegroundColor Gray
Write-Host "  Port: $PGPORT" -ForegroundColor Gray
Write-Host "  Database: $PGDATABASE" -ForegroundColor Gray
Write-Host "  User: $PGUSER" -ForegroundColor Gray
Write-Host ""

# Set environment variable for password
$env:PGPASSWORD = $PGPASSWORD

# Run the migration script
Write-Host "Running migration script..." -ForegroundColor Yellow
Write-Host ""

try {
    # Execute the SQL file using psql
    & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f "fix_rejection_letter_columns.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "Migration completed successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "The following columns have been added:" -ForegroundColor Cyan
        Write-Host "  - first_rejection_date" -ForegroundColor White
        Write-Host "  - rejection_letter_sent" -ForegroundColor White
        Write-Host "  - rejection_letter_sent_at" -ForegroundColor White
        Write-Host "  - rejection_letter_auto_sent" -ForegroundColor White
        Write-Host ""
        Write-Host "You can now start the application:" -ForegroundColor Cyan
        Write-Host "  mvn spring-boot:run" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "Migration failed!" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please check the error messages above" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error running migration!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure PostgreSQL is installed and psql.exe is available" -ForegroundColor Yellow
    Write-Host "Default location: C:\Program Files\PostgreSQL\16\bin\psql.exe" -ForegroundColor Yellow
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
