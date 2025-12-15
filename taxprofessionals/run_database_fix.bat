@echo off
echo Running database constraint fix...
echo.

set PGPASSWORD=mugisha1234!@

"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d taxpayer_db_backup -c "ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_bachelor_degree_check;"
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d taxpayer_db_backup -c "ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_professional_qualification_check;"
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d taxpayer_db_backup -c "ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_certificate_type_check;"
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d taxpayer_db_backup -c "ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_masters_degree_check;"
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d taxpayer_db_backup -c "ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_other_professional_check;"

echo.
echo Verifying constraints are removed...
echo.
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d taxpayer_db_backup -c "SELECT conname FROM pg_constraint WHERE conrelid = 'documents'::regclass AND contype = 'c';"

echo.
echo Done! Press any key to exit...
pause

