#!/bin/bash
# ==============================================================================
# Nestora — 1-Click Code Update Script for Oracle Cloud
# Usage: sudo bash deploy/oracle/update.sh [branch_name]
# ==============================================================================

set -euo pipefail

BRANCH="${1:-feat/production-ready}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_DIR"

echo "🔄 Pulling latest changes from git branch: $BRANCH..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "🐳 Rebuilding and updating Docker containers..."
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

echo "🌱 Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

echo "✅ Nestora updated successfully!"
