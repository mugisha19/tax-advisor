-- Fix Document Upload Constraint Errors
-- Run this in PostgreSQL to remove the CHECK constraints

\c taxpayer_db_backup

-- Drop CHECK constraints that are causing the error
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_bachelor_degree_check;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_professional_qualification_check;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_certificate_type_check;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_masters_degree_check;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_other_professional_check;

-- Verify constraints are removed
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'documents'::regclass 
AND contype = 'c';

-- If you see any constraints with names like 'documents_*_check', drop them too:
-- ALTER TABLE documents DROP CONSTRAINT IF EXISTS <constraint_name>;

COMMIT;

