# Deployment Guide

This project should be deployed as two services:

- `client`: Vite React frontend, deployable on Vercel.
- `server`: Express, Socket.IO, Prisma, uploads, and code execution backend. Host this on a long-running Node/container platform such as Render, Railway, Fly.io, or a VPS.

The backend should not be deployed as Vercel Functions because it uses Socket.IO, local PDF uploads, `httpServer.listen`, and child processes for code execution.

## Frontend on Vercel

Create a Vercel project with these settings:

- Root Directory: `proper/client`
- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js Version: `20.x`, `22.x`, or `24.x`

Set this Vercel environment variable:

```env
VITE_API_ORIGIN=https://your-backend-domain.example.com
```

Do not include `/api` in `VITE_API_ORIGIN`. The frontend adds `/api` for REST calls and uses the origin directly for Socket.IO and file downloads.

`client/vercel.json` includes the SPA rewrite required for browser refreshes on React Router routes.

## Backend Hosting

Use a host that supports:

- Long-running Node.js servers.
- WebSockets.
- Docker or Node build/start commands.
- Persistent file storage or an external blob store.
- Child processes and `g++` if C++ code execution remains enabled.

Required backend environment variables:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/database?sslmode=require
JWT_SECRET=replace_with_at_least_32_random_characters
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-vercel-frontend.vercel.app
```

Recommended backend commands without Docker:

```bash
npm install
npm run build
npm start
```

`npm start` runs Prisma generation and migrations before starting the compiled server.

## Database

Use PostgreSQL. Neon is a good fit for this project.

Run migrations against production with:

```bash
npm --prefix server run migrate:deploy
```

If your `DATABASE_URL` is a pooled Neon URL, set `DIRECT_URL` too so migrations can use a direct database connection.

## Uploads

The current backend stores uploaded PDFs in the local `uploads/` directory. For production, either:

- Mount persistent storage for `server/uploads`.
- Or migrate uploads to Vercel Blob, S3, Cloudinary, or another object storage service.

The provided Docker Compose file mounts a persistent `server_uploads` volume.

## Docker Compose

Create a root `.env` file using the variables above, then run:

```bash
docker-compose up --build -d
```

This starts:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost`

For Docker frontend builds, set `VITE_API_ORIGIN` in the root `.env` before building.

## Health Check

The backend exposes:

```http
GET /health
```

It returns `200` when the server and database are reachable, and `503` when the database is unavailable.

## Security Checklist

- Set `CORS_ORIGIN` to the exact Vercel frontend URL.
- Use a strong `JWT_SECRET` with at least 32 characters.
- Keep `.env` files out of git.
- Use HTTPS for both frontend and backend.
- Prefer external object storage for uploaded PDFs if you deploy to multiple backend instances.
