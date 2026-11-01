#!/bin/bash
# ==============================================================================
# Nestora — Automated PostgreSQL Database Backup Script
# Retains 14 days of backups in /var/backups/nestora/
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/var/backups/nestora"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/nestora_db_${TIMESTAMP}.sql.gz"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

mkdir -p "$BACKUP_DIR"

# Source environment for database credentials
if [ -f "${PROJECT_DIR}/.env" ]; then
  POSTGRES_USER=$(grep -E '^POSTGRES_USER=' "${PROJECT_DIR}/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "postgres")
  POSTGRES_DB=$(grep -E '^POSTGRES_DB=' "${PROJECT_DIR}/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "nestora_db")
else
  POSTGRES_USER="postgres"
  POSTGRES_DB="nestora_db"
fi

POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-nestora_db}

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Nestora database backup..."

cd "$PROJECT_DIR"
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup created: $BACKUP_FILE ($FILE_SIZE)"

# Delete backups older than 14 days
find "$BACKUP_DIR" -type f -name "nestora_db_*.sql.gz" -mtime +14 -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaned up backups older than 14 days."
