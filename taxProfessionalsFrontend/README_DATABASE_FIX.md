# Database Migration Fix - Rejection Letter Columns

## Problem

Your application is failing to start with this error:

```
ERROR: column tp1_0.rejection_letter_auto_sent does not exist
ERROR: column "rejection_letter_sent" of relation "tax_professionals" contains null values
```

## Cause

The `TaxProfessional` entity in your code has new fields for the automatic rejection letter feature:

- `first_rejection_date`
- `rejection_letter_sent`
- `rejection_letter_sent_at`
- `rejection_letter_auto_sent`

But your PostgreSQL database doesn't have these columns yet.

## Solution

You need to run a database migration to add these columns.

---

## Option 1: Using PowerShell Script (Easiest)

Run this command in your project directory:

```powershell
.\run-database-migration.ps1
```

This will automatically:

1. Connect to your PostgreSQL database
2. Add the missing columns
3. Set default values for existing rows
4. Verify the migration was successful

---

## Option 2: Manual SQL Execution

If the PowerShell script doesn't work, run the SQL manually:

### Step 1: Open PostgreSQL Command Line

```powershell
# Replace with your actual PostgreSQL installation path if different
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d taxpayer_db_backup
```

Enter your PostgreSQL password when prompted: `mugisha1234!@`

### Step 2: Run these SQL commands

```sql
-- Add columns
ALTER TABLE tax_professionals
ADD COLUMN IF NOT EXISTS first_rejection_date TIMESTAMP;

ALTER TABLE tax_professionals
ADD COLUMN IF NOT EXISTS rejection_letter_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE tax_professionals
ADD COLUMN IF NOT EXISTS rejection_letter_sent_at TIMESTAMP;

ALTER TABLE tax_professionals
ADD COLUMN IF NOT EXISTS rejection_letter_auto_sent BOOLEAN DEFAULT FALSE;

-- Update existing NULL values
UPDATE tax_professionals
SET rejection_letter_sent = FALSE
WHERE rejection_letter_sent IS NULL;

UPDATE tax_professionals
SET rejection_letter_auto_sent = FALSE
WHERE rejection_letter_auto_sent IS NULL;

-- Make columns NOT NULL
ALTER TABLE tax_professionals
ALTER COLUMN rejection_letter_sent SET NOT NULL;

ALTER TABLE tax_professionals
ALTER COLUMN rejection_letter_auto_sent SET NOT NULL;

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tax_professionals'
AND column_name IN (
    'first_rejection_date',
    'rejection_letter_sent',
    'rejection_letter_sent_at',
    'rejection_letter_auto_sent'
);
```

---

## Option 3: Using SQL File

```powershell
# Navigate to project directory
cd "C:\Users\habiy\Desktop\Web Tech\Spring Boot\rra\taxprofessionals"

# Run the migration SQL file
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d taxpayer_db_backup -f fix_rejection_letter_columns.sql
```

---

## Verification

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tax_professionals'
AND column_name LIKE '%rejection_letter%'
ORDER BY column_name;
```

Expected output:

| column_name                | data_type                   | is_nullable | column_default |
| -------------------------- | --------------------------- | ----------- | -------------- |
| first_rejection_date       | timestamp without time zone | YES         | NULL           |
| rejection_letter_auto_sent | boolean                     | NO          | false          |
| rejection_letter_sent      | boolean                     | NO          | false          |
| rejection_letter_sent_at   | timestamp without time zone | YES         | NULL           |

---

## After Migration

Once the migration is complete, restart your Spring Boot application:

```powershell
# Make sure JAVA_HOME is set
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"

# Start the application
mvn spring-boot:run
```

The application should now start successfully!

---

## Troubleshooting

### "psql.exe not found"

Find your PostgreSQL installation:

```powershell
# Common locations:
C:\Program Files\PostgreSQL\16\bin\psql.exe
C:\Program Files\PostgreSQL\15\bin\psql.exe
C:\Program Files\PostgreSQL\14\bin\psql.exe

# Or search for it:
Get-ChildItem -Path "C:\Program Files" -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue
```

Update the path in `run-database-migration.ps1` if needed.

### "Password authentication failed"

The password in the script is: `mugisha1234!@`

If this is incorrect, update it in `run-database-migration.ps1` on line 11.

### "Database does not exist"

The database name is: `taxpayer_db_backup`

If this is incorrect, update it in `run-database-migration.ps1` on line 10.

---

## Why This Happened

The automatic rejection letter feature added new fields to the `TaxProfessional` entity class. While Hibernate is configured with `ddl-auto=update` to automatically update the schema, it sometimes fails to add NOT NULL columns when there's existing data.

The manual migration ensures:

1. Columns are added safely
2. Existing rows get default values (FALSE)
3. Constraints are applied correctly

---

## Summary

**Problem:** Database missing columns for rejection letter feature  
**Solution:** Run database migration SQL script  
**Files to use:**

- `fix_rejection_letter_columns.sql` - The SQL migration script
- `run-database-migration.ps1` - PowerShell helper script

**Next step:** Run the migration, then restart your application!
