# Nestora — Oracle Cloud Always Free Complete Hosting Guide

This guide details how to host the **entire Nestora stack** (Frontend SPA, Node.js Backend API, PostgreSQL Database, and Host Disk Media Storage) **100% free forever** on an Oracle Cloud Infrastructure (OCI) Always Free instance.

---

## 🌟 Why Oracle Cloud Always Free for Nestora?

| Resource | Oracle Always Free Allocation | Nestora Consumption | Cost |
| :--- | :--- | :--- | :--- |
| **Compute Shape** | Ampere ARM A1 (up to 4 OCPUs) | 2 to 4 OCPUs | **$0.00** |
| **Memory (RAM)** | Up to 24 GB RAM | 2 to 4 GB RAM | **$0.00** |
| **Boot Volume Disk**| 200 GB NVMe Storage | ~15 GB (OS + DB) + **185 GB for Photos** (~370,000 photos) | **$0.00** |
| **Outbound Transfer**| 10 TB / month | Typically < 50 GB / month | **$0.00** |
| **IPv4 Address** | 1 Reserved Public IPv4 | 1 Public IP | **$0.00** |

---

## 🏗️ Architecture on Oracle Cloud

```
                   Internet / Users
                          │
                          ▼
            [ Ports 80 (HTTP) & 443 (HTTPS) ]
                          │
     ┌────────────────────┴────────────────────┐
     │   Oracle Cloud Instance (Ubuntu LTS)    │
     │                                         │
     │   ┌─────────────────────────────────┐   │
     │   │      Frontend Container         │   │
     │   │  (Nginx Alpine: React SPA)      │   │
     │   └───────────────┬─────────────────┘   │
     │                   │ /api/               │
     │                   ▼                     │
     │   ┌─────────────────────────────────┐   │
     │   │      Backend Container          │   │
     │   │    (Node.js 20 Express API)     │   │
     │   └───────────────┬─────────────────┘   │
     │                   │ port 5432           │
     │                   ▼                     │
     │   ┌─────────────────────────────────┐   │
     │   │     PostgreSQL Container        │   │
     │   │     (Postgres 16 Alpine)        │   │
     │   └─────────────────────────────────┘   │
     │                                         │
     │   Persistent Volumes on NVMe Disk:      │
     │   • /var/lib/postgresql/data (DB Data)  │
     │   • backend/uploads/ (All Media Photos) │
     │   • /var/backups/nestora/ (Backups)     │
     └─────────────────────────────────────────┘
```

---

## 📋 Step-by-Step Deployment Instructions

### Step 1: Create an Oracle Cloud Always Free Account
1. Visit [oracle.com/cloud/free](https://www.oracle.com/cloud/free/) and sign up.
2. Select your closest Home Region (e.g., Mumbai, Singapore, Frankfurt, Ashburn).

---

### Step 2: Create the Ampere A1 Compute Instance
1. In the Oracle Cloud Console, navigate to **Compute** ➔ **Instances** ➔ **Create Instance**.
2. **Name**: `nestora-server`.
3. **Image and Shape**:
   - Click **Edit**.
   - **Image**: Select **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS** (Canonical Ubuntu).
   - **Shape**: Click **Change Shape** ➔ Select **Ampere** (ARM processor) ➔ Select **VM.Standard.A1.Flex**.
   - Set **OCPUs**: `2` (or up to `4`).
   - Set **Memory**: `12 GB` (or up to `24 GB`).
4. **Networking**:
   - Ensure **Assign a public IPv4 address** is checked (**Yes**).
5. **Add SSH Keys**:
   - Select **Generate a key pair for me** and download both the **Private Key** and **Public Key** to your computer.
6. **Boot Volume**:
   - Check **Specify a custom boot volume size** and set to `100 GB` or `200 GB` (within Always Free limit).
7. Click **Create**. Within 1–2 minutes, your instance state will change to **Running**. Note down the **Public IP Address**.

---

### Step 3: Open Ingress Ports in Oracle Cloud VCN Security Rules
By default, Oracle Cloud blocks inbound ports. You must allow HTTP and HTTPS:

1. On your instance details page, click on the subnet link under **Primary VNIC** (e.g. `subnet-...`).
2. Click on the **Default Security List for...**.
3. Under **Ingress Rules**, click **Add Ingress Rules**:
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: `TCP`
   - **Destination Port Range**: `80,443`
   - **Description**: `Allow HTTP and HTTPS`
4. Click **Add Ingress Rules**.

---

### Step 4: Connect to Your Server via SSH
Open PowerShell or your terminal on your computer:

```bash
# Set secure permissions on your private key (Linux/macOS)
chmod 400 /path/to/your-ssh-key.key

# Connect to the instance
ssh -i /path/to/your-ssh-key.key ubuntu@<YOUR_ORACLE_PUBLIC_IP>
```

---

### Step 5: Run the 1-Click Bootstrap Script
Once logged into your Oracle server, run this single block of commands:

```bash
# 1. Clone the repository
git clone https://github.com/cascade-technologies-solutions/Nestora.git
cd Nestora
git checkout feat/production-ready

# 2. Run the automated setup script
sudo bash deploy/oracle/setup.sh
```

#### What `setup.sh` automatically does for you:
1. Installs Docker CE & Docker Compose plugin.
2. Unblocks Oracle's local Ubuntu OS firewall (`iptables` & `ufw` rules for ports 80 & 443).
3. Generates cryptographically secure production `.env` secrets (`JWT_SECRET`, database passwords).
4. Creates persistent directories for the PostgreSQL database, media photos, and daily backups.
5. Builds and starts the production container stack (`postgres`, `backend`, `frontend`).
6. Executes database migrations (`npx prisma migrate deploy`) and idempotent seeding (`npm run seed`).
7. Sets up an automated daily database backup cron job at 3:00 AM.

---

### Step 6: Access Your Live Site!
When the script completes, Nestora is live on the internet:

* **Public Website**: `http://<YOUR_ORACLE_PUBLIC_IP>`
* **Admin Login**: `http://<YOUR_ORACLE_PUBLIC_IP>/admin/login`
  * **Username**: `superadmin`
  * **Password**: `NestoraSuperAdmin2026!`

---

## 🔒 Step 7: (Optional) Attach a Domain and Enable Free SSL (HTTPS)

When you are ready to point your domain (e.g., `nestora.in` or `properties.yourdomain.com`):

1. **Add DNS Records**:
   - In your domain DNS manager (GoDaddy, Cloudflare, Namecheap, etc.), add an **A Record**:
     - **Name / Host**: `@` (or subdomain)
     - **Value / Target**: `<YOUR_ORACLE_PUBLIC_IP>`
2. **Run the 1-Click SSL Activation Script on your server**:
   ```bash
   cd ~/Nestora
   sudo bash deploy/oracle/enable-ssl.sh yourdomain.com admin@yourdomain.com
   ```
3. Your site will automatically switch to **HTTPS (`https://yourdomain.com`)** with automatic certificate renewals configured!

---

## 🔄 Useful Server Commands & Maintenance

### 1-Click Application Update (Deploying code changes)
Whenever you push updates to GitHub, simply SSH into your server and run:
```bash
cd ~/Nestora
sudo bash deploy/oracle/update.sh
```

### Manual Database Backup
To create a backup snapshot on demand:
```bash
sudo bash deploy/oracle/backup-db.sh
```
Backups are archived with timestamps in `/var/backups/nestora/nestora_db_YYYYMMDD_HHMMSS.sql.gz`.

### Restore Database from Backup
```bash
gunzip < /var/backups/nestora/nestora_db_YYYYMMDD_HHMMSS.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres psql -U nestora_admin nestora_db
```

### View Live Logs
```bash
# View backend API logs
docker compose -f docker-compose.prod.yml logs -f backend

# View frontend / Nginx logs
docker compose -f docker-compose.prod.yml logs -f frontend

# View database logs
docker compose -f docker-compose.prod.yml logs -f postgres
```

