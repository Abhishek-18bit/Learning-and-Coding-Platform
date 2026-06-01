# Proper Project Guide

## Structure
- Frontend: `client/`
- Backend: `server/`
- Database schema + migrations: `server/prisma/`
- Docs/specs: `docs/`

## Where To Edit
- UI pages/components: `client/src/pages/`, `client/src/components/`
- Frontend API calls: `client/src/services/`
- Backend routes/controllers/services: `server/src/routes/`, `server/src/controllers/`, `server/src/services/`
- DB model changes: `server/prisma/schema.prisma`

## Run (Development)
0. Configure server environment (`server/.env`):
```env
# Runtime (pooler) URL
DATABASE_URL=postgresql://<user>:<password>@<endpoint>-pooler.<region>.aws.neon.tech/<db>?sslmode=require

# Optional but recommended for migrations (direct endpoint, no -pooler)
DIRECT_URL=postgresql://<user>:<password>@<endpoint>.<region>.aws.neon.tech/<db>?sslmode=require
```

1. Backend terminal:
```powershell
cd server
npm install
npm run dev 
```

2. Frontend terminal:
```powershell
cd client
npm install
npm run start:clean
```

## Useful Commands
- Prisma generate:
```powershell
cd server
npx prisma generate
```

- Apply migrations:
```powershell
cd server
npx prisma migrate deploy
```

- Client build:
```powershell
npm --prefix client run build
```

- Server typecheck:
```powershell
npx tsc -p server/tsconfig.json --noEmit
```
