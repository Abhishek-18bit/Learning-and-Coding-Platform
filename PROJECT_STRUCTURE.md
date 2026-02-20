# Project Structure Guide

This repository is now organized around 3 core areas:

## 1) Frontend (UI)
- Path: `client/`
- Main source: `client/src/`
- Pages: `client/src/pages/`
- Reusable components: `client/src/components/`
- API calls from frontend: `client/src/services/`

## 2) Backend (API + Business Logic)
- Path: `server/`
- Main source: `server/src/`
- Routes: `server/src/routes/`
- Controllers: `server/src/controllers/`
- Services (business logic): `server/src/services/`
- Middlewares: `server/src/middlewares/`

## 3) Database (Schema + Migrations)
- Path: `server/prisma/`
- Schema: `server/prisma/schema.prisma`
- Migrations: `server/prisma/migrations/`

## Supporting Folders
- Docs/specs: `docs/`
- CI workflow: `.github/workflows/`
- Docker setup: `docker-compose.yml`, `client/Dockerfile`, `server/Dockerfile`

## Cleanup Done
Removed unnecessary generated/duplicate artifacts:
- `proper.zip`
- `client/dist/`
- `client/dev_err.txt`
- `server/prisma.config.ts.bak`
- `server/test_output.txt`
- `server/test-output.txt`
- root `node_modules/`

## One Pending Deletion
A leftover duplicate folder still exists due a locked Windows binary file:
- `_duplicate_cleanup_pending/`

After closing running dev tools (or after restart), remove it with:

```powershell
Remove-Item -Recurse -Force _duplicate_cleanup_pending
```
