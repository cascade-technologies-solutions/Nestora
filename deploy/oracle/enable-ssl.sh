#!/bin/bash
# ==============================================================================
# Nestora — 1-Click Let's Encrypt SSL Activation Script
# Usage: sudo bash deploy/oracle/enable-ssl.sh yourdomain.com admin@yourdomain.com
# ==============================================================================

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root or with sudo: sudo bash deploy/oracle/enable-ssl.sh yourdomain.com admin@yourdomain.com"
  exit 1
fi

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "❌ Error: Missing domain name or email."
  echo "Usage: sudo bash deploy/oracle/enable-ssl.sh yourdomain.com admin@yourdomain.com"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_DIR"

echo "🔐 Step 1/4: Installing Certbot..."
apt-get update -y
apt-get install -y certbot

mkdir -p deploy/certbot/www deploy/certbot/conf

echo "🌐 Step 2/4: Requesting Let's Encrypt certificate for $DOMAIN..."
certbot certonly --webroot \
  -w "$PROJECT_DIR/deploy/certbot/www" \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive \
  --preferred-challenges http

# Copy/link certificates to mountable directory
mkdir -p deploy/certbot/conf/live/"$DOMAIN"
cp -L /etc/letsencrypt/live/"$DOMAIN"/fullchain.pem deploy/certbot/conf/live/"$DOMAIN"/fullchain.pem
cp -L /etc/letsencrypt/live/"$DOMAIN"/privkey.pem deploy/certbot/conf/live/"$DOMAIN"/privkey.pem

echo "⚙️ Step 3/4: Generating SSL-enabled Nginx configuration..."
sed "s/\${DOMAIN_NAME}/$DOMAIN/g" deploy/nginx/ssl.conf.template > deploy/nginx/default.conf

# Update .env with new domain
sed -i "s|^CLIENT_URL=.*|CLIENT_URL=https://$DOMAIN|g" .env
sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN|g" .env
sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=https://$DOMAIN,http://$DOMAIN|g" .env

echo "🔄 Step 4/4: Applying HTTPS configuration to running frontend container..."
docker compose -f docker-compose.prod.yml restart frontend backend

# Setup Auto-renewal cron
RENEW_JOB="0 2 * * 1 certbot renew --quiet && cp -L /etc/letsencrypt/live/$DOMAIN/*.pem $PROJECT_DIR/deploy/certbot/conf/live/$DOMAIN/ && docker compose -f $PROJECT_DIR/docker-compose.prod.yml restart frontend"
(crontab -l 2>/dev/null | grep -F -v "certbot renew" ; echo "$RENEW_JOB") | crontab -

echo ""
echo "=========================================================="
echo "🎉 SSL Successfully Enabled for https://$DOMAIN"
echo "=========================================================="
echo "🌐 Public URL:   https://$DOMAIN"
echo "🔑 Admin URL:    https://$DOMAIN/admin/login"
echo "🔄 Auto-renewal: Configured weekly on Monday at 2:00 AM."
echo "=========================================================="
