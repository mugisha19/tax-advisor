#!/bin/bash

# Database Restore Script for Tax Advisor System

# Configuration
DB_NAME="tax_advisory"
DB_USER="postgres"
BACKUP_DIR="/opt/tax-advisor/backups"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/tax_advisory_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Confirm restore
echo "⚠️  WARNING: This will restore the database from:"
echo "   $BACKUP_FILE"
echo ""
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Perform restore
echo "Starting restore at $(date)"
gunzip -c "$BACKUP_FILE" | PGPASSWORD="Rra_postgres_db_2025" psql -U "$DB_USER" -h localhost "$DB_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Restore completed successfully"
else
    echo "❌ Restore failed!"
    exit 1
fi

echo "Restore completed at $(date)"
