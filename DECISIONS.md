# Nestora Autonomous Execution Decisions Log

This document records all architectural decisions and judgment calls made during autonomous execution in accordance with the `defaults_table` and project operating rules.

| # | Date | Topic | Decision | Rationale |
|---|---|---|---|---|
| 1 | 2026-10-16 | Media Storage Driver | **Host Disk Storage** (`STORAGE_DRIVER=local`) | Zero cloud storage bills, utilizes included 10 GB - 50 GB hosting disk, multer diskStorage saving to `backend/uploads/` served via Express static. |
| 2 | 2026-10-16 | Database Port | **Port 5435:5432** for local Docker container | Host machine has a native Windows PostgreSQL process bound to 5432. Container maps 5435 to avoid port collision. Production connection strings use standard ports. |
| 3 | 2026-10-16 | Password Hashing | **bcryptjs** (cost 12) | Pure JS compatibility on Windows and Linux without native node-gyp build failures across container environments. |
| 4 | 2026-10-16 | Git Workflow | **feat/production-ready** branch | Isolated from main; conventional commits made after every verified phase. Main branch remains untouched until user morning review. |
| 5 | 2026-10-16 | Admin UX Strategy (P7X) | **Save All + Guardrails + Inline Actions** | Deliver low-click administrative workflows: inline property publishing, one-click enquiry progression, sticky CMS quick-nav, unsaved change guardrails, media drag-and-drop. |
