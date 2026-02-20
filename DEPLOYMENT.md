# Deployment Guide

## 1. Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local dev)
- PostgreSQL Database (NeonDB)

## 2. Environment Variables

Create a `.env` file in the root directory (or use CI secrets):

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/neondb?sslmode=require"

# Auth
JWT_SECRET="your_secure_random_string_min_32_chars"

# App
NODE_ENV="production"
PORT=3000
CORS_ORIGIN="http://your-domain.com" # or * for public

# Client Build Time Env
VITE_API_URL="http://your-domain.com/api" # URL where backend is reachable
```

## 3. Docker Deployment

To build and start the full stack:

```bash
docker-compose up --build -d
```

This will start:
- **Server** on port `3000`
- **Client** (Nginx) on port `80`

## 4. CI/CD Pipeline

A GitHub Actions workflow is located at `.github/workflows/ci.yml`. It runs on every push to `main` and checks:
- Backend dependency installation & build
- Prisma Client generation
- Backend Tests
- Frontend linting & build

## 5. Monitoring

### Health Checks
The backend exposes a health endpoint at:
`GET /health`

Returns:
- `200 OK`: Database connected & Server running.
- `503 Service Unavailable`: Database connectivity issue.

### Logging
- Request logs are output to stdout in Apache Combined format (via Morgan).
- Application errors are logged to stderr using the custom error handler.
- Recommend forwarding logs to a service (e.g., Datadog, ELK Stack, or CloudWatch) in production.

## 6. Security Checklist

- [ ] Ensure `JWT_SECRET` is strong and rotated periodically.
- [ ] Set `CORS_ORIGIN` to specific frontend domains.
- [ ] Use HTTPS (Reverse Proxy / Load Balancer) in front of Docker containers.
- [ ] Database credentials should be rotated.
