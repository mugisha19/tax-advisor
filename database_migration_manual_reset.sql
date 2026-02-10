-- =====================================================
-- Manual Reset Feature - Database Migration
-- =====================================================
-- Purpose: Add columns to track manual reset actions
-- for rejected applications while preserving audit trail
-- Author: System
-- Date: 2024
-- =====================================================

-- Add manual reset tracking columns
ALTER TABLE tax_professionals 
ADD COLUMN IF NOT EXISTS is_manual_reset BOOLEAN DEFAULT FALSE;

ALTER TABLE tax_professionals 
ADD COLUMN IF NOT EXISTS manual_reset_date TIMESTAMP;

ALTER TABLE tax_professionals 
ADD COLUMN IF NOT EXISTS manual_reset_by VARCHAR(255);

ALTER TABLE tax_professionals 
ADD COLUMN IF NOT EXISTS manual_reset_reason VARCHAR(500);

ALTER TABLE tax_professionals 
ADD COLUMN IF NOT EXISTS manual_reset_count INTEGER DEFAULT 0;

ALTER TABLE tax_professionals 
ADD COLUMN IF NOT EXISTS rejection_count_at_reset INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN tax_professionals.is_manual_reset IS 'Flag indicating if application was manually reset by admin';
COMMENT ON COLUMN tax_professionals.manual_reset_date IS 'Timestamp of last manual reset';
COMMENT ON COLUMN tax_professionals.manual_reset_by IS 'Name of officer who performed manual reset';
COMMENT ON COLUMN tax_professionals.manual_reset_reason IS 'Official reason for manual reset (required for audit)';
COMMENT ON COLUMN tax_professionals.manual_reset_count IS 'Number of times application has been manually reset';
COMMENT ON COLUMN tax_professionals.rejection_count_at_reset IS 'Rejection count at time of last manual reset (preserves history)';

-- Create index for querying reset applications
CREATE INDEX IF NOT EXISTS idx_tax_professionals_manual_reset 
ON tax_professionals(is_manual_reset, manual_reset_date DESC) 
WHERE is_manual_reset = TRUE;

-- Create index for querying by reset officer
CREATE INDEX IF NOT EXISTS idx_tax_professionals_reset_by 
ON tax_professionals(manual_reset_by) 
WHERE manual_reset_by IS NOT NULL;

-- Verify migration
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'tax_professionals'
    AND column_name IN (
        'is_manual_reset',
        'manual_reset_date',
        'manual_reset_by',
        'manual_reset_reason',
        'manual_reset_count',
        'rejection_count_at_reset'
    );
    
    IF column_count = 6 THEN
        RAISE NOTICE '✅ Manual Reset Migration Complete: All 6 columns added successfully';
    ELSE
        RAISE WARNING '⚠️ Manual Reset Migration Incomplete: Only % of 6 columns found', column_count;
    END IF;
END $$;

-- Example queries for monitoring reset activity

-- Query 1: Find all manually reset applications
-- SELECT tpin, names, status, manual_reset_count, manual_reset_date, manual_reset_by
-- FROM tax_professionals
-- WHERE is_manual_reset = TRUE
-- ORDER BY manual_reset_date DESC;

-- Query 2: Find applications reset multiple times
-- SELECT tpin, names, manual_reset_count, manual_reset_by, rejection_count_at_reset
-- FROM tax_professionals
-- WHERE manual_reset_count > 1
-- ORDER BY manual_reset_count DESC;

-- Query 3: Reset statistics by officer
-- SELECT manual_reset_by, COUNT(*) as reset_count, MAX(manual_reset_date) as last_reset
-- FROM tax_professionals
-- WHERE is_manual_reset = TRUE
-- GROUP BY manual_reset_by
-- ORDER BY reset_count DESC;

-- Query 4: Applications with high rejection counts that were reset
-- SELECT tpin, names, rejection_count_at_reset, manual_reset_date, manual_reset_reason
-- FROM tax_professionals
-- WHERE rejection_count_at_reset >= 2
-- ORDER BY rejection_count_at_reset DESC;

-- =====================================================
-- Rollback Script (if needed)
-- =====================================================
-- WARNING: This will delete all manual reset data!
-- Only use this if you need to completely remove the feature

-- DROP INDEX IF EXISTS idx_tax_professionals_manual_reset;
-- DROP INDEX IF EXISTS idx_tax_professionals_reset_by;
-- ALTER TABLE tax_professionals DROP COLUMN IF EXISTS is_manual_reset;
-- ALTER TABLE tax_professionals DROP COLUMN IF EXISTS manual_reset_date;
-- ALTER TABLE tax_professionals DROP COLUMN IF EXISTS manual_reset_by;
-- ALTER TABLE tax_professionals DROP COLUMN IF EXISTS manual_reset_reason;
-- ALTER TABLE tax_professionals DROP COLUMN IF EXISTS manual_reset_count;
-- ALTER TABLE tax_professionals DROP COLUMN IF EXISTS rejection_count_at_reset;
-- =====================================================
