# Nestora — 100% Free Hosting Guide (NO Credit Card Required)

This guide takes Nestora live on the internet using modern cloud platforms that offer **instant signups via GitHub or Google with ZERO credit card or payment verification required**.

---

## 🏆 The "Zero Credit Card" Production Stack

| Layer | Recommended Platform | Why It's Best | Credit Card Needed? |
| :--- | :--- | :--- | :---: |
| **Database** | **Neon.tech** | Free Serverless PostgreSQL 16 (0.5 GB, autoscaling, connection pooling) | ❌ **NO** (GitHub / Google login) |
| **Backend API** | **Render** | Free Web Service (Node.js 20, automatic Git deployments, free HTTPS) | ❌ **NO** (GitHub / Google login) |
| **Frontend** | **Vercel** | Free global edge CDN, automatic Vite SPA routing, free SSL | ❌ **NO** (GitHub / Google login) |

> ⏱️ **Total Setup Time**: ~7 minutes.

---

## 📋 Step 1: Create Free PostgreSQL Database on Neon (2 Minutes)

1. Open [**neon.tech**](https://neon.tech/) in your browser.
2. Click **Sign up** ➔ Select **Continue with GitHub**.
3. Click **Create Project**:
   - **Name**: `nestora-db`
   - **Postgres version**: `16` (Default)
   - **Region**: Pick your closest region (e.g., *AWS us-east-2* or *eu-central-1*).
4. Click **Create Project**.
5. On the dashboard, you will see your **Connection Details**:
   - Switch dropdown from `psql` to **Connection string**.
   - Ensure **Pooled connection** checkbox is checked.
   - Click **Copy**. It looks like this:
     ```text
     postgresql://neondb_owner:npg_XXXXX@ep-cool-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   *(Keep this string handy for Step 2).*

---

## 📋 Step 2: Deploy Backend API to Render (3 Minutes)

1. Open [**render.com**](https://render.com/) in your browser.
2. Click **Get Started for Free** ➔ Select **GitHub**.
3. On your Render dashboard, click **New +** (top right) ➔ Select **Web Service**.
4. Choose **Build and deploy from a Git repository** ➔ Select your `Nestora` repository.
5. Fill in the service configuration:
   - **Name**: `nestora-backend`
   - **Region**: Same region as your Neon database (e.g. *Ohio (US East)* or *Frankfurt*).
   - **Branch**: `feat/production-ready` (or `main`)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run migrate && npm run seed && npm start
     ```
   - **Instance Type**: Select **Free** ($0/month).
6. Scroll down to **Environment Variables** and click **Add Environment Variable**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production mode |
   | `DATABASE_URL` | *(Paste your Neon connection string from Step 1)* | Database URL |
   | `JWT_SECRET` | `nestora_super_secure_jwt_access_token_32chars!` | Min 16 chars |
   | `JWT_REFRESH_SECRET` | `nestora_super_secure_refresh_key_min_32chars!` | Min 16 chars |
   | `CORS_ORIGINS` | `*` | Allows your frontend to connect |
   | `SEED_SUPERADMIN_USERNAME` | `superadmin` | Initial admin username |
   | `SEED_SUPERADMIN_PASSWORD` | `NestoraSuperAdmin2026!` | Initial admin password |
7. Click **Create Web Service**.
8. Render will now clone your code, compile Prisma, apply database migrations, seed the database, and start the server.
9. Once the logs show `🚀 Nestora Backend running on http://localhost:...`:
   - Copy your Render backend URL at the top (e.g. `https://nestora-backend-xxxx.onrender.com`).
   - Verify it by opening `https://nestora-backend-xxxx.onrender.com/api/v1/health` in your browser. You should see:
     ```json
     {"status":"UP","message":"Backend connects securely to database."}
     ```

---

## 📋 Step 3: Deploy Frontend to Vercel (2 Minutes)

1. Open [**vercel.com**](https://vercel.com/) in your browser.
2. Click **Sign Up** ➔ Select **Continue with GitHub**.
3. On the Vercel dashboard, click **Add New...** ➔ Select **Project**.
4. Find your `Nestora` repository and click **Import**.
5. Configure the project:
   - **Framework Preset**: `Vite` (Vercel automatically detects this).
   - **Root Directory**: `./` (Leave default).
   - **Build Command**: `npm run build` (Default).
   - **Output Directory**: `dist` (Default).
6. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://nestora-backend-xxxx.onrender.com/api/v1` *(Your Render URL from Step 2 with `/api/v1` at the end)* |
   | `VITE_BASE_PATH` | `/` |
7. Click **Deploy**.
8. Within ~60 seconds, Vercel will complete the build and display confetti with your live production URL (e.g. `https://nestora-frontend.vercel.app`)!

---

## 🚀 Step 4: Test & Verify Admin Console CMS

1. Open your live Vercel URL in your browser:
   ```text
   https://nestora-frontend.vercel.app/admin/login
   ```
2. Log in with your Super Admin credentials:
   - **Username**: `superadmin`
   - **Password**: `NestoraSuperAdmin2026!`
3. You are now logged into the live cloud CMS!
   - Create or edit properties under **Properties**.
   - Manage leads under **Enquiries**.
   - Edit headlines under **CMS Sections** and save them with `Ctrl+S`.
   - All changes persist permanently in your live Neon cloud PostgreSQL database!

---

## 💡 Notes on Free Tier Behavior

* **Render Free Inactivity**: Free Render instances sleep after 15 minutes of inactivity. When someone visits the site after a period of dormancy, the first API request takes ~30–45 seconds to wake up the server. Once awake, all subsequent requests are instantaneous.
* **Alternative Zero-CC Frontend**: If you prefer **Netlify**, the project also includes `netlify.toml` for 1-click Netlify imports.

