# Nestora Production Hosting & Zero-Cost Operations Runbook

> **Target Architecture**: Single-tenant multi-service corporate platform & real estate portal with PostgreSQL database, JWT/RBAC security, and **host disk media storage ($0 cloud fees)**.

---

## Table of Contents
1. [Storage Architecture & Capacity Economics](#1-storage-architecture--capacity-economics)
2. [Database Provisioning Options](#2-database-provisioning-options)
3. [Deployment Option A: GoDaddy / cPanel Shared Hosting](#3-deployment-option-a-godaddy--cpanel-shared-hosting)
4. [Deployment Option B: Linux VPS (Ubuntu 22.04/24.04 LTS with Docker & Nginx)](#4-deployment-option-b-linux-vps-ubuntu-22042404-lts-with-docker--nginx)
5. [Deployment Option C: Modern PaaS (Render, Railway, Coolify)](#5-deployment-option-c-modern-paas-render-railway-coolify)
6. [Initial Database Setup, Migrations & Super Admin Access](#6-initial-database-setup-migrations--super-admin-access)
7. [Automated Disaster Recovery & Backups](#7-automated-disaster-recovery--backups)
8. [Pre-Flight Launch Verification Checklist](#8-pre-flight-launch-verification-checklist)

---

## 1. Storage Architecture & Capacity Economics

### Why Host Disk Storage?
Nestora eliminates recurring AWS S3 or Cloudinary monthly fees by saving uploaded photos directly to the server's local file system at `backend/uploads/` and serving them statically over high-speed HTTP with client-side caching.

- **Local Storage Path**: `backend/uploads/{properties,projects,cms,general}/`
- **Public URL Mapping**: `https://yourdomain.com/uploads/...`
- **MIME Validation**: JPEG, PNG, WebP, AVIF (SVG & scripts strictly rejected).
- **File Limit**: 10 MB per photo maximum (client compresses standard uploads to ~300 KB–800 KB).

### Storage Capacity Breakdown
| Hosting Plan Disk Space | Reserved for OS & Node | Free Space for Photos | Estimated Photos (~500 KB average) |
|---|---|---|---|
| **10 GB** (GoDaddy Starter) | ~1.5 GB | ~8.5 GB | **~17,400 photos** |
| **25 GB** (GoDaddy Deluxe) | ~2.0 GB | ~23.0 GB | **~47,000 photos** |
| **50 GB** (Basic $5 VPS) | ~3.0 GB | ~47.0 GB | **~96,000 photos** |
| **100 GB** ($10 VPS) | ~4.0 GB | ~96.0 GB | **~196,000 photos** |

> **Conclusion**: You can run Nestora with thousands of real estate listings and portfolio projects on your existing hosting package for **$0 additional monthly storage bills**.

---

## 2. Database Provisioning Options

Nestora requires **PostgreSQL 14, 15, or 16**. Choose one of the following:

### Option 2.1: Free Managed Cloud Postgres (Zero Server Maintenance)
- **Neon** (Recommended - Free Tier): 0.5 GB storage, instant branching, automated backups. [neon.tech](https://neon.tech)
- **Supabase** (Free Tier): 500 MB database, high availability, pooled connection string. [supabase.com](https://supabase.com)
- **Aiven / Render**: Free or low-cost ($7/mo) managed PostgreSQL.

*Connection String format*:
```env
DATABASE_URL="postgresql://username:password@ep-cool-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Option 2.2: Self-Hosted PostgreSQL Container
If running on a VPS, use the included Docker Compose configuration (`docker-compose.prod.yml`). The database runs locally on port 5432 with volume persistence.

---

## 3. Deployment Option A: GoDaddy / cPanel Shared Hosting

Use this option if you already have GoDaddy cPanel hosting with the **Setup Node.js App** feature enabled.

### Step 1: Prepare the Frontend Build
1. In your local development machine:
   ```powershell
   npm run build
   ```
2. The compiled static files will be generated in `dist/`. Vite automatically copies `public/.htaccess` into `dist/.htaccess`.
3. Upload all files inside `dist/` directly into the `public_html/` folder in cPanel File Manager.

### Step 2: Configure the Node.js Backend Application in cPanel
1. Log into your **cPanel** dashboard.
2. Under the **Software** section, click on **Setup Node.js App**.
3. Click **Create Application**:
   - **Node.js version**: Choose `20.x` or higher.
   - **Application mode**: `Production`.
   - **Application root**: `nestora-backend` (this creates a folder outside `public_html`).
   - **Application URL**: Select your domain or a subdomain (e.g., `api.yourdomain.com` or default root).
   - **Application startup file**: `dist/server.js`.
4. Click **Create**.

### Step 3: Upload Backend Files & Install Dependencies
1. Zip the `backend/` folder on your local machine (exclude `node_modules` and `uploads`).
2. Upload and extract into the cPanel `nestora-backend/` folder.
3. In cPanel Node.js App manager, click **Run NPM Install** (or enter the virtual environment via SSH/Terminal and run `npm ci --omit=dev`).
4. Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```
5. Apply database migrations to your remote PostgreSQL instance:
   ```bash
   npx prisma migrate deploy
   ```

### Step 4: Configure Environment Variables
In the cPanel Node.js App interface, scroll down to **Environment Variables** and add:
- `NODE_ENV`: `production`
- `PORT`: `4000` (or the port assigned by cPanel)
- `DATABASE_URL`: Your managed PostgreSQL connection URL (e.g. Neon or Supabase).
- `JWT_SECRET`: Random 64-character secret.
- `JWT_REFRESH_SECRET`: Separate random 64-character secret.
- `CLIENT_URL`: `https://yourdomain.com`
- `CORS_ORIGIN`: `https://yourdomain.com`
- `UPLOAD_DIR`: `uploads`

### Step 5: Configure `.htaccess` Reverse Proxy
Ensure `public_html/.htaccess` contains the proxy rewrite rules:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Force HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Proxy API requests to Node.js backend
  <IfModule mod_proxy.c>
    RewriteRule ^api/(.*)$ http://127.0.0.1:4000/api/$1 [P,L]
  </IfModule>

  # SPA Routing Fallback
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
```

---

## 4. Deployment Option B: Linux VPS (Ubuntu 22.04/24.04 LTS with Docker & Nginx)

This is the **gold standard production setup**. Ideal for DigitalOcean ($6/mo droplet), Hetzner ($4/mo), Linode, AWS EC2, or Hostinger VPS.

### Step 1: Connect to Server & Install Dependencies
```bash
ssh root@your-server-ip

# Update packages
apt update && apt upgrade -y

# Install Docker, Git, Nginx, Certbot
apt install -y git curl ufw nginx certbot python3-certbot-nginx docker.io docker-compose-plugin

# Enable firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

### Step 2: Clone Repository & Configure Environment
```bash
cd /var/www
git clone https://github.com/cascade-technologies-solutions/Nestora.git
cd Nestora
git checkout feat/production-ready

# Create production environment file
cp .env.example .env
nano .env
```
Fill in production secrets:
```env
POSTGRES_USER=nestora_admin
POSTGRES_PASSWORD=UseAStrongUniquePasswordHere!2026
POSTGRES_DB=nestora_production
JWT_SECRET=generate_with_openssl_rand_hex_32
JWT_REFRESH_SECRET=generate_with_openssl_rand_hex_32_alt
CLIENT_URL=https://nestora.in
CORS_ORIGIN=https://nestora.in
```

### Step 3: Launch Production Stack via Docker Compose
```bash
# Build and launch PostgreSQL, Backend and Frontend containers in background
docker compose -f docker-compose.prod.yml up -d --build

# Verify all containers are healthy
docker compose -f docker-compose.prod.yml ps
```

### Step 4: Run Initial Database Migration & Seed
```bash
# Execute Prisma migration inside the running backend container
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed initial superadmin and default settings (runs idempotently)
docker compose -f docker-compose.prod.yml exec backend npm run seed
```

### Step 5: Configure Nginx & SSL Certificate
Create `/etc/nginx/sites-available/nestora`:
```nginx
server {
    listen 80;
    server_name nestora.in www.nestora.in;

    client_max_body_size 25M;

    # Frontend and API reverse proxy to Docker container on port 80
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and obtain free Let's Encrypt SSL:
```bash
ln -s /etc/nginx/sites-available/nestora /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Generate SSL certificate
certbot --nginx -d nestora.in -d www.nestora.in
```

---

## 5. Deployment Option C: Modern PaaS (Render, Railway, Coolify)

### Render.com Setup
1. **New PostgreSQL Database**: Create a Render PostgreSQL database (free tier). Copy the `Internal Database URL`.
2. **New Web Service (Backend)**:
   - Root directory: `backend`
   - Environment: `Docker` (Render automatically uses `backend/Dockerfile`).
   - Add **Disks** (Persistent Volume):
     - Name: `nestora-uploads`
     - Mount Path: `/app/uploads`
     - Size: `5 GB` or `10 GB`
   - Environment Variables:
     - `DATABASE_URL`: Pasted from Step 1.
     - `JWT_SECRET`: Random 64-char string.
     - `JWT_REFRESH_SECRET`: Random 64-char string.
     - `CLIENT_URL`: `https://your-frontend.onrender.com`
     - `CORS_ORIGIN`: `https://your-frontend.onrender.com`
3. **New Static Site (Frontend)**:
   - Root directory: `.`
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Rewrite rule for SPA: `/* -> /index.html` (Rewrite, 200).
   - Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api/v1`

---

## 6. Initial Database Setup, Migrations & Super Admin Access

Upon first deployment, seed the database with the initial credentials:

### 1. Initial Super Admin Credentials
- **Username**: `superadmin`
- **Email**: `admin@nestora.in`
- **Initial Password**: `NestoraSuperAdmin2026!`

> **Security Advisory**: Immediately after your first login at `https://yourdomain.com/admin/login`, navigate to **Admin Settings** or **Employees** and change the super admin password!

### 2. Verify Health Status
Open in your browser:
```
https://yourdomain.com/api/v1/health
```
Expected response:
```json
{
  "status": "UP",
  "message": "Backend connects securely to database."
}
```

---

## 7. Automated Disaster Recovery & Backups

### 1-Click UI Backup
From the Admin Console:
1. Navigate to **Admin Settings** (`/admin/settings`).
2. Scroll to the **Database Migration & Disaster Recovery** card.
3. Click **Export DB Backup (JSON)**. This downloads a complete snapshot of all properties, projects, services, enquiries, CMS sections, and settings.

### Server-Level Automated Daily Backup (Cron on VPS)
Add this to `crontab -e` on your VPS to automatically backup PostgreSQL and uploaded photos every night at 2:00 AM:
```bash
0 2 * * * docker compose -f /var/www/Nestora/docker-compose.prod.yml exec -T postgres pg_dump -U postgres nestora_db | gzip > /var/backups/nestora_db_$(date +\%Y\%m\%d).sql.gz
15 2 * * * tar -czf /var/backups/nestora_uploads_$(date +\%Y\%m\%d).tar.gz -C /var/www/Nestora/backend uploads
30 2 * * * find /var/backups/ -type f -mtime +30 -delete
```

---

## 8. Pre-Flight Launch Verification Checklist

Before announcing the site or pointing public DNS:

- [ ] **1. DNS Configuration**: `A` record pointing to your server IP; `www` CNAME record set.
- [ ] **2. HTTPS Active**: SSL certificate valid and auto-redirecting from HTTP to HTTPS.
- [ ] **3. Health Check 200**: `GET /api/v1/health` returns `{"status":"UP"}`.
- [ ] **4. Super Admin Login**: Log in with credentials, verify all 8 administrative navigation tabs load.
- [ ] **5. Change Default Password**: Update superadmin password from default seed value.
- [ ] **6. Media Upload Test**: Go to **Media Library**, upload a test image. Confirm file is stored in `backend/uploads/` and displays publicly.
- [ ] **7. Create Real Listing**: Create and publish a property; verify it renders on the live public `/real-estate` page.
- [ ] **8. Submit Public Enquiry**: Fill out the contact form on public website; verify it appears in the admin inbox with High/Medium priority.
- [ ] **9. CMS Live Edit**: Edit the Hero Title in Admin CMS and click Save; verify changes appear immediately on homepage without redeploying.
- [ ] **10. Download JSON Backup**: Export a initial database backup file and store it safely in offline storage.
