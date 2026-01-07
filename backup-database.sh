#!/bin/bash

# Database Backup Script for Tax Advisor System
# Backs up PostgreSQL database with rotation

# Configuration
DB_NAME="tax_advisory"
DB_USER="postgres"
BACKUP_DIR="/var/tax-advisor-data/backups"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/tax_advisory_backup_$TIMESTAMP.sql.gz"

# Perform backup
echo "Starting backup at $(date)"
PGPASSWORD="Rra_postgres_db_2025" pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup completed: $BACKUP_FILE"
    echo "   Size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Delete old backups (older than RETENTION_DAYS)
find "$BACKUP_DIR" -name "tax_advisory_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "🗑️  Cleaned up backups older than $RETENTION_DAYS days"

echo "Backup completed at $(date)"
