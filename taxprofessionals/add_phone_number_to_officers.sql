-- ============================================
-- SMS Fallback Feature - Database Migration
-- ============================================
-- Description: Add phone_number column to officers table
-- Date: 2026-01-09
-- Author: System

-- Add phone_number column to officers table
-- This column is nullable to support existing officers
ALTER TABLE officers 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(255);

-- Optional: Add index for phone number lookups (if needed for performance)
-- CREATE INDEX IF NOT EXISTS idx_officers_phone_number ON officers(phone_number);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'officers' AND column_name = 'phone_number';

-- Sample update query (if you want to add phone numbers to existing officers)
-- UPDATE officers SET phone_number = '0788123456' WHERE employee_id = 'EMP001';

-- ============================================
-- Rollback Script (if needed)
-- ============================================
-- To rollback this migration, run:
-- ALTER TABLE officers DROP COLUMN IF EXISTS phone_number;
