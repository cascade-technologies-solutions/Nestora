# Nestora Production Evolution — Progress Ledger

| Phase | Title | Checklist Refs | Status | Evidence Summary |
|---|---|---|---|---|
| **P0** | Workspace bootstrap & lint hygiene | #28 | **DONE** | Aligned `@typescript-eslint` packages to `^8.26.0`, fixed syntax errors (`₹{` -> `${}`), `npm run lint` exits 0, `npm run build` exits 0, docker-compose.yml created, `.env.example` committed. |
| **P1** | PostgreSQL provisioning, schema, migrations, seed | #1, #2, #3 | **DONE** | Docker Postgres container running, baseline migration applied, schema extended with User, WishlistItem, EmployeePermission, RefreshToken, CmsSection, extended Property & MediaAsset. Seed script runs idempotently, `GET /api/v1/health` returns `UP` via SQL query. |
| **P2** | Production authentication (admin & public) | #4, #5 | **DONE** | Backend JWT access + rotating refresh tokens + bcrypt password hashing. Frontend contexts connected to DB endpoints. All hardcoded bypasses (`superadmin`/`admin123`, SHA-256 hash, localhost auto-login) 100% eliminated (`grep` verified 0 occurrences). Live tests verified: seeded superadmin -> 200 with 8 permissions; old bypass -> 401; public register/login -> 201/200. |
| **P3** | Granular RBAC and server-side authorization | #6, #7 | **DONE** | Server-enforced RBAC: Super Admin (all 8 permissions), Admin (6 permissions, no employees/settings), Employee (granular `EmployeePermission` overrides, default none). Frontend updated with Employee role. Automated tests prove 401 unauthenticated, 403 forbidden without permission, 200 with permission, and granular employee override activation. |
| **P4** | Business APIs, audit logging, wishlist | #8, #9, #10, #11, #12, #15, #16, #17 | **DONE** | Full CRUD APIs for Properties (auto `NST-###` code, draft/published filter), Projects, Services, Enquiries (public submit, rate-limited, admin triage), CMS Sections (hero, about, contact, brand, footer, social + bulk-update), Settings, Employees, Wishlist, and Audit Logging. Live verification passed: draft hiding, status update, project/service operations, triage notes, wishlist add/fetch/remove, and SQL AuditLog row persistence verified. |
| **P5** | Media storage (host disk) & Media API | #13, #14 | **DONE** | Host disk storage implemented via `multer.diskStorage` saving to `backend/uploads/` (`properties/`, `projects/`, `cms/`, `general/`) and statically served at `/uploads/...` ($0 cloud storage fees). Media CRUD API completed with MIME filtering (jpeg/png/webp/avif), 10MB limit, file rename, replace, bulk delete, and 409 reference protection (blocks deletion when image is used in properties/projects/services/CMS). Verified end-to-end via `verify-p5.ts`. |
| **P6** | Cross-cutting hardening & security | #20, #21, #22 | **DONE** | Centralized sanitized error handling (`errorHandler.ts`) translating Zod 400s with field errors, Prisma P2002 -> 409 Conflict, P2025 -> 404, Multer 413, and sanitized 500s with Request ID (zero stack traces or internal SQL leaks). Helmet security headers and express-rate-limiters (global 300/15m, auth 10/15m, enquiry 5/h) active. Fail-fast boot environment validator implemented. Secret audit confirmed zero plaintext secrets in repo. |
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

### Phase P4: Business APIs, Audit Logging & Wishlist
- **Routers Mounted in `server.ts`**:
  - Properties (`/api/v1/properties`, `/api/v1/admin/properties`)
  - Projects (`/api/v1/projects`, `/api/v1/admin/projects`)
  - Services (`/api/v1/services`, `/api/v1/admin/services`)
  - Enquiries (`/api/v1/enquiries`, `/api/v1/admin/enquiries`)
  - CMS Sections (`/api/v1/cms`, `/api/v1/admin/cms`)
  - Settings (`/api/v1/settings`, `/api/v1/admin/settings`)
  - Employees (`/api/v1/admin/employees`)
  - Audit Logs (`/api/v1/admin/audit-logs`)
  - Wishlist (`/api/v1/wishlist`)
- **Live Automated Verification (`backend/scripts/verify-p4.ts`) Evidence**:
  - Property auto-sequence `NST-106` generated with status `draft`.
  - Draft property confirmed completely hidden from public `GET /api/v1/properties`.
  - Property status published via `PATCH /api/v1/admin/properties/:id/status` -> immediately accessible via public `GET /api/v1/properties/:id`.
  - Project created, published, verified via public endpoint.
  - Public services verified: 7 services returned.
  - Public enquiry submitted -> triaged by admin (`status: Site Visit`, `priority: High`, `internalNotes` saved).
  - CMS hero section read -> updated via `PUT /api/v1/admin/cms/bulk-update`.
  - Public settings fetched: `NestoraHub`.
  - User registered -> property added to wishlist -> retrieved -> deleted.
  - PostgreSQL `AuditLog` table: verified real rows created on admin mutations.
- **Build & Lint**: `npm run lint` 0 errors, `npm run build` succeeded (8.83s).

### Phase P5: Media Storage (Host Disk) & Media API
- **Host Disk Storage Architecture**:
  - `storageService.ts` using `multer.diskStorage` saving to `backend/uploads/` (`properties/`, `projects/`, `cms/`, `general/`).
  - Statically served via `app.use('/uploads', express.static(UPLOAD_BASE_DIR))` ($0 cloud storage fees, up to ~19,000 photos on 10 GB hosting).
  - Physical file deletion via `fs.promises.unlink`.
- **Media API Endpoints**:
  - `POST /api/v1/admin/media/upload`: Multipart upload with MIME validation (JPEG, PNG, WebP, AVIF) and 10MB limit.
  - `GET /api/v1/admin/media`: Search, folder filter, sort, pagination.
  - `PATCH /api/v1/admin/media/:id/rename`: File renaming with audit logging.
  - `POST /api/v1/admin/media/:id/replace`: Physical replacement of file keeping the same ID.
  - `DELETE /api/v1/admin/media/:id`: Reference-safe deletion (queries Properties, Projects, Services, and CMS sections; blocks deletion with 409 if referenced; allows override with `?force=true`).
  - `POST /api/v1/admin/media/bulk-delete`: Bulk deletion with reference safety.
- **Live Automated Verification (`backend/scripts/verify-p5.ts`) Evidence**:
  - Valid image uploaded to `properties` folder -> 201 Created with `/uploads/properties/...` URL.
  - Public HTTP GET on `/uploads/properties/...` verified returning HTTP 200 with `image/png`.
  - Physical file verified on host disk.
  - Media asset listed and renamed.
  - Reference check verified: deletion blocked with HTTP 409 when referenced in `Property NST-REF-TEST`.
  - Once unreferenced, asset successfully unlinked and confirmed deleted from filesystem.
  - Unauthenticated upload blocked with HTTP 401.
- **Build & Lint**: `npm run lint` 0 errors, `backend/` tsc build passed with 0 errors.

### Phase P6: Cross-Cutting Hardening & Security
- **Security Headers & Rate Limiting**:
  - `helmetMiddleware`: Configured with `crossOriginResourcePolicy: cross-origin` to safely allow hosted `/uploads` assets.
  - `globalLimiter`: 300 requests / 15 min across all `/api` endpoints.
  - `authLimiter`: 10 attempts / 15 min on sensitive auth routes (`/api/v1/admin/auth/login`, `/api/v1/auth/login`).
  - `enquiryLimiter`: 5 submissions / hour per IP on `/api/v1/enquiries`.
- **Centralized Sanitized Error Handling (`errorHandler.ts`)**:
  - Zod validation errors mapped to structured 400 `VALIDATION_ERROR` with field details.
  - Multer `LIMIT_FILE_SIZE` mapped to 413 `PAYLOAD_TOO_LARGE`.
  - Prisma `P2002` mapped to 409 `DUPLICATE_RESOURCE` / `EMAIL_ALREADY_EXISTS`.
  - Prisma `P2025` mapped to 404 `NOT_FOUND`.
  - All 500 errors sanitized with unique Request ID; zero internal stack traces or SQL details leaked to clients.
- **Fail-Fast Boot Validator**:
  - `validateBootEnvironment()` checks `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` before startup.
- **Live Verification (`backend/scripts/verify-p6.ts`) Evidence**:
  - Helmet headers verified on live HTTP response (`x-content-type-options: nosniff`, `cross-origin-resource-policy: cross-origin`).
  - Zod malformed property payload returned structured HTTP 400 with field details.
  - Duplicate user registration returned HTTP 409 with unique constraint collision handling.
  - Confirmed zero stack traces or SQL leaked in error JSON.
- **Build & Lint**: `npm run lint` 0 errors, `backend/` tsc build passed with 0 errors.
