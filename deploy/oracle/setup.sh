#!/bin/bash
# ==============================================================================
# Nestora — Oracle Cloud Always Free 1-Click Bootstrap Script
# Target: Ubuntu 22.04 / 24.04 LTS on Ampere A1 (ARM64) or AMD64
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "🚀 Nestora: Bootstrapping on Oracle Cloud Always Free"
echo "=========================================================="

# Check root or sudo
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root or with sudo: sudo bash deploy/oracle/setup.sh"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_DIR"
echo "📂 Project root: $PROJECT_DIR"

# 1. System Package Updates & Prerequisites
echo "📦 Step 1/6: Installing system prerequisites & Docker..."
apt-get update -y
apt-get install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  git \
  iptables-persistent \
  netfilter-persistent \
  openssl \
  cron

# Install official Docker if not installed
if ! command -v docker &> /dev/null; then
  echo "Installing Docker CE..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
fi

# 2. Oracle Cloud Specific Firewall Configuration
# Oracle Cloud Ubuntu images have strict iptables rules that drop ports 80 & 443 by default.
echo "🛡️ Step 2/6: Configuring Oracle Cloud OS firewall for HTTP (80) & HTTPS (443)..."
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || iptables -A INPUT -p tcp --dport 443 -j ACCEPT
netfilter-persistent save || true

if command -v ufw &> /dev/null; then
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  ufw allow 22/tcp || true
fi

# 3. Create Host Directories for Zero-Cost Persistent Storage
echo "📁 Step 3/6: Setting up persistent directories..."
mkdir -p backend/uploads/properties backend/uploads/projects backend/uploads/cms backend/uploads/general
mkdir -p deploy/certbot/www deploy/certbot/conf
mkdir -p /var/backups/nestora

# Ensure uploads directory is readable and writable by Docker user (UID 1001)
chown -R 1001:1001 backend/uploads || chmod -R 777 backend/uploads

# 4. Generate Production Secrets if .env doesn't exist
echo "🔐 Step 4/6: Checking production environment configuration..."
if [ ! -f .env ]; then
  echo "Generating fresh secure .env file..."
  JWT_SECRET=$(openssl rand -hex 32)
  JWT_REFRESH_SECRET=$(openssl rand -hex 32)
  POSTGRES_PASSWORD=$(openssl rand -hex 24)

  cat <<EOF > .env
# Production Environment for Oracle Cloud
NODE_ENV=production
POSTGRES_USER=nestora_admin
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=nestora_db
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
CLIENT_URL=http://localhost
CORS_ORIGIN=http://localhost
CORS_ORIGINS=http://localhost,https://localhost
SEED_SUPERADMIN_USERNAME=superadmin
SEED_SUPERADMIN_PASSWORD=NestoraSuperAdmin2026!
EOF
  echo "✅ Secure .env created with auto-generated secrets."
else
  echo "ℹ️ Existing .env file found. Preserving current secrets."
fi

# 5. Build and Launch Containers via Docker Compose
echo "🐳 Step 5/6: Building and launching Nestora container stack..."
docker compose -f docker-compose.prod.yml down || true
docker compose -f docker-compose.prod.yml up -d --build

# Wait for backend healthcheck
echo "Waiting for services to become healthy..."
MAX_RETRIES=30
COUNT=0
until docker compose -f docker-compose.prod.yml exec -T backend wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health &> /dev/null || [ $COUNT -eq $MAX_RETRIES ]; do
  sleep 2
  COUNT=$((COUNT + 1))
  echo -n "."
done
echo ""

if [ $COUNT -eq $MAX_RETRIES ]; then
  echo "⚠️ Warning: Backend healthcheck timed out. Checking logs:"
  docker compose -f docker-compose.prod.yml logs backend
else
  echo "✅ Backend API and PostgreSQL are healthy!"
fi

# 6. Apply Database Migrations and Initial Seed
echo "🌱 Step 6/6: Running database migrations and seeding initial data..."
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec -T backend npm run seed

# 7. Configure Automated Daily Backup Cron Job
echo "⏰ Setting up daily automated database backup (3:00 AM)..."
chmod +x deploy/oracle/backup-db.sh
CRON_JOB="0 3 * * * $PROJECT_DIR/deploy/oracle/backup-db.sh > /var/log/nestora_backup.log 2>&1"
(crontab -l 2>/dev/null | grep -F -v "backup-db.sh" ; echo "$CRON_JOB") | crontab -

PUBLIC_IP=$(curl -s https://api.ipify.org || echo "<your-server-ip>")

echo ""
echo "=========================================================="
echo "🎉 SUCCESS: Nestora is LIVE on Oracle Cloud Always Free!"
echo "=========================================================="
echo "🌐 Website URL:      http://${PUBLIC_IP}"
echo "🔑 Admin Console:    http://${PUBLIC_IP}/admin/login"
echo "👤 Super Admin:      superadmin"
echo "🔒 Admin Password:    NestoraSuperAdmin2026!"
echo ""
echo "📌 Next Steps:"
echo "1. Ensure port 80 and 443 are allowed in Oracle Cloud VCN Ingress Rules."
echo "2. When you attach a domain, run:"
echo "   sudo bash deploy/oracle/enable-ssl.sh yourdomain.com admin@yourdomain.com"
echo "=========================================================="

