# Nestora Production Evolution — Progress Ledger

| Phase | Title | Checklist Refs | Status | Evidence Summary |
|---|---|---|---|---|
| **P0** | Workspace bootstrap & lint hygiene | #28 | **DONE** | Aligned `@typescript-eslint` packages to `^8.26.0`, fixed syntax errors (`₹{` -> `${}`), `npm run lint` exits 0, `npm run build` exits 0, docker-compose.yml created, `.env.example` committed. |
| **P1** | PostgreSQL provisioning, schema, migrations, seed | #1, #2, #3 | **DONE** | Docker Postgres container running, baseline migration applied, schema extended with User, WishlistItem, EmployeePermission, RefreshToken, CmsSection, extended Property & MediaAsset. Seed script runs idempotently, `GET /api/v1/health` returns `UP` via SQL query. |
| **P2** | Production authentication (admin & public) | #4, #5 | **DONE** | Backend JWT access + rotating refresh tokens + bcrypt password hashing. Frontend contexts connected to DB endpoints. All hardcoded bypasses (`superadmin`/`admin123`, SHA-256 hash, localhost auto-login) 100% eliminated (`grep` verified 0 occurrences). Live tests verified: seeded superadmin -> 200 with 8 permissions; old bypass -> 401; public register/login -> 201/200. |
| **P3** | Granular RBAC and server-side authorization | #6, #7 | **DONE** | Server-enforced RBAC: Super Admin (all 8 permissions), Admin (6 permissions, no employees/settings), Employee (granular `EmployeePermission` overrides, default none). Frontend updated with Employee role. Automated tests prove 401 unauthenticated, 403 forbidden without permission, 200 with permission, and granular employee override activation. |
| **P4** | Business APIs, audit logging, wishlist | #8, #9, #10, #11, #12, #15, #16, #17 | **PENDING** | |
| **P5** | Media storage (host disk) & Media API | #13, #14 | **PENDING** | |
| **P6** | Cross-cutting hardening & security | #20, #21, #22 | **PENDING** | |
| **P7** | Frontend API migration & React Query | #18, #19 | **PENDING** | |
| **P7X**| Admin console UX optimization (low-click) | N/A | **PENDING** | |
| **P8** | Data migration (localStorage to PostgreSQL) | #23 | **PENDING** | |
| **P9** | Production deployment artifacts & HOSTING.md | #24 | **PENDING** | |
| **P10**| Automated tests (backend + E2E), security QA, release gate | #25, #26, #27, #29 | **PENDING** | |

---

## Detailed Phase Logs

### Phase P0: Workspace Bootstrap & Lint Hygiene
- **Branch**: `feat/production-ready`
- **Lint**: `npm run lint` passed with 0 errors.
- **Frontend Build**: `npm run build` succeeded cleanly.
- **Environment**: `.env.example` committed for root and `backend/`. Real `.env` created and gitignored.
- **Docker Compose**: Container `nestora_postgres` created.

### Phase P1: PostgreSQL Provisioning & Schema
- **Database Port**: Container mapped to port `5435:5432` locally (due to existing native Windows service on 5432).
- **Migration**: Applied `20261016135523_init` creating all 13 tables and indexes.
- **Health Check**: `GET /api/v1/health` verified returning `{"status":"UP","message":"Backend connects securely to database."}`.
- **Seed**: `prisma/seed.ts` executed idempotently; seeded superadmin, settings, CMS sections, services, properties, projects.

### Phase P2: Production Authentication — Admin & Public Users
- **Backend Token Service**: `backend/src/services/authService.ts` using bcrypt (cost 12), JWT access tokens (15m), rotating SHA-256 hashed refresh tokens (7d).
- **Auth Middleware**: `backend/src/middleware/authMiddleware.ts` with `requireAuth`, `requirePermission`, and dynamic effective permission calculation.
- **Auth Controllers**: `backend/src/controllers/authController.ts` supporting `adminLogin`, `adminRefresh`, `adminLogout`, `adminMe`, `publicRegister`, `publicLogin`, `publicRefresh`, `publicLogout`, `publicMe`.
- **Frontend API Client**: `src/lib/api.ts` with Bearer headers and automatic silent refresh.
- **Frontend Contexts**: `AdminAuthContext.tsx` and `AuthContext.tsx` rewritten to call PostgreSQL endpoints.
- **Demo Bypasses Removed**:
  - `grep -ri "admin123" src/` -> 0 matches.
  - `grep -ri "240be518" src/` -> 0 matches.
  - `grep -ri "DEFAULT_SUPERADMIN_HASH" src/` -> 0 matches.
  - `grep -ri "isDemoSuperAdmin" src/` -> 0 matches.
- **Live Verification**:
  - `POST /admin/auth/login` with `superadmin` / `NestoraSuperAdmin2026!` -> HTTP 200 (8 permissions).
  - `POST /admin/auth/login` with `superadmin` / `admin123` -> HTTP 401 INVALID_CREDENTIALS.
  - `GET /admin/auth/me` with Bearer token -> HTTP 200.
  - `POST /auth/register` -> HTTP 201.
  - `POST /auth/login` -> HTTP 200.
  - `GET /auth/me` -> HTTP 200.
- **Build & Lint**: `npm run lint` 0 errors, `npm run build` green.

### Phase P3: Granular RBAC and Server-Side Authorization
- **Role Hierarchy**:
  - `Super Admin`: Full administrative access (all 8 permissions: `manage:employees`, `manage:settings`, `manage:properties`, `manage:projects`, `manage:services`, `manage:enquiries`, `manage:media`, `manage:cms`).
  - `Admin`: Full operations access except employees and company settings (6 permissions).
  - `Employee`: Zero permissions by default; permissions dynamically granted through `EmployeePermission` rows in PostgreSQL.
- **Frontend Permission Matrix**: Updated `src/admin/lib/permissions.ts` and `src/admin/lib/rbac.ts` with `Employee` role and dynamic user permission evaluation.
- **Live RBAC Matrix Test Evidence**:
  - Unauthenticated access on protected route: `HTTP 401 UNAUTHENTICATED`.
  - Super Admin on `manage:employees`, `manage:settings`, `manage:properties`, `manage:cms`: `HTTP 200`.
  - Admin on `manage:properties`: `HTTP 200`.
  - Admin on `manage:employees`: `HTTP 403 FORBIDDEN`.
  - Admin on `manage:settings`: `HTTP 403 FORBIDDEN`.
  - Employee without override on `manage:properties`: `HTTP 403 FORBIDDEN`.
  - Employee with `manage:properties` DB override: `HTTP 200 OK`.
  - Employee with override on `manage:settings`: `HTTP 403 FORBIDDEN`.
- **Build & Lint**: `npm run lint` 0 errors, `npm run build` green.
