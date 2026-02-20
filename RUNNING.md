# How to Run the Project

This project consists of a Node.js/Express backend (server) and a React/Vite frontend (client).

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL database (Neon recommended)

## 1. Backend Setup (Server)

Navigate to the `server` directory:

```powershell
cd server
```

### Configuration
Ensure you have a `.env` file in the `server` root with the following variables:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="your_super_secret_key_ensure_it_is_long_enough"
CORS_ORIGIN="*"
```

### Installation
Install dependencies if you haven't already:

```powershell
npm install
```

### Database Migration
If setting up for the first time or after schema changes:

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

### Running the Server

**Recommended Method (PowerShell):**
This script automatically cleans up old processes on port 5000 and ensures environment variables are loaded correctly.

```powershell
npm run start:clean
```

**Alternative Method:**
```powershell
npm run dev
```

The server will start at `http://localhost:5000`.
Health check: `http://localhost:5000/health`

## 2. Frontend Setup (Client)

Open a **new terminal** and navigate to the `client` directory:

```powershell
cd client
```

### Installation
Install dependencies:

```powershell
npm install
```

### Running the Client

Start the development server:

```powershell
npm run dev
```

The client will typically start at `http://localhost:5173`.

## 3. Testing Login

A test user is available for verification:
- **Email**: `test.user@example.com`
- **Password**: `password123`

You can also register new users via the signup page.
