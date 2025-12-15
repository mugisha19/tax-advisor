-- ================================================================
-- FIX: Add Rejection Letter Columns to tax_professionals Table
-- ================================================================
-- This script adds the missing columns needed for the automatic
-- rejection letter feature
-- ================================================================

-- Step 1: Add columns with NULL allowed first, then set defaults
ALTER TABLE tax_professionals 
ADD COLUMN IF NOT EXISTS first_rejection_date TIMESTAMP;

ALTER TABLE tax_professionals 
ADD COLUMN IF NOT EXISTS rejection_letter_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE tax_professionals 
ADD COLUMN IF NOT EXISTS rejection_letter_sent_at TIMESTAMP;

ALTER TABLE tax_professionals 
ADD COLUMN IF NOT EXISTS rejection_letter_auto_sent BOOLEAN DEFAULT FALSE;

-- Step 2: Update existing NULL values to FALSE
UPDATE tax_professionals 
SET rejection_letter_sent = FALSE 
WHERE rejection_letter_sent IS NULL;

UPDATE tax_professionals 
SET rejection_letter_auto_sent = FALSE 
WHERE rejection_letter_auto_sent IS NULL;

-- Step 3: Make columns NOT NULL after setting defaults
ALTER TABLE tax_professionals 
ALTER COLUMN rejection_letter_sent SET NOT NULL;

ALTER TABLE tax_professionals 
ALTER COLUMN rejection_letter_auto_sent SET NOT NULL;

-- ================================================================
-- VERIFICATION
-- ================================================================

-- Check that all columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tax_professionals'
AND column_name IN (
    'first_rejection_date',
    'rejection_letter_sent',
    'rejection_letter_sent_at',
    'rejection_letter_auto_sent'
)
ORDER BY column_name;

-- Check that no NULL values exist
SELECT 
    COUNT(*) as total_rows,
    COUNT(rejection_letter_sent) as non_null_sent,
    COUNT(rejection_letter_auto_sent) as non_null_auto_sent
FROM tax_professionals;

SELECT 'Migration completed successfully!' AS status;
