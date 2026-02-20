# 🏛️ Final Architecture Specification

**Role:** Principal Software Architect  
**Status:** FROZEN  
**Date:** 2026-02-07  

---

## 1. 🧊 Frozen System-Level Decisions

The following architectural decisions are finalized and non-negotiable:

### 1.1 Core Architecture
- **Pattern:** Client-Server with Layered Backend (Controller-Service-Repository).
- **Frontend:** Antigravity (React-based) with TypeScript, Tailwind CSS, and TanStack Query.
- **Backend:** Antigravity Server (Node.js/TypeScript) with RESTful APIs.
- **Database:** PostgreSQL via NeonDB using Prisma ORM.
- **Communication:** REST for primary data flow; WebSockets/SSE for real-time dashboard and notification updates.

### 1.2 Security & Authentication
- **Identity:** JWT-based stateless authentication.
- **Access Control:** Role-Based Access Control (RBAC) with two primary roles: `STUDENT` and `TEACHER`.
- **Encryption:** All passwords MUST be hashed using Argon2 or BCrypt before storage. No plain-text passwords.

### 1.3 Data Persistence
- **ID Strategy:** Global use of UUID v4 for all primary and foreign keys.
- **Timezone:** All timestamps stored and transmitted in UTC.
- **Integrity:** Referential integrity enforced via PostgreSQL foreign keys.

---

## 2. 🔍 DB Schema vs API Contract Validation

| Entity | DB Consistency | API Consistency | Validation Status |
| :--- | :--- | :--- | :--- |
| **User** | Has `role` enum | Supports `STUDENT`/`TEACHER` | ✅ PASSED |
| **Course** | Hierarchical to Teacher | RBAC enforced on `POST` | ✅ PASSED |
| **Problem** | Includes `difficulty` enum | Matches `EASY/MEDIUM/HARD` | ✅ PASSED |
| **Quiz** | MCQ-based JSON storage | `POST` aligns with MCQ structure | ✅ PASSED |
| **Submission** | Status: `PENDING, ACCEPTED, REJECTED` | Managed by internal logic | ✅ PASSED |
| **Real-time** | Notifications & Activity Logs table exists | APIs support fetch & mark-as-read | ✅ PASSED |

**Architect's Note:** The DB Schema and API Contract are 100% aligned. The backend logic is responsible for the transition states (e.g., updating `Submission.status` after evaluation).

---

## 3. 🛡️ Non-Negotiable Constraints

1.  **Strict Typing:** Full TypeScript implementation across both Client and Server. `any` is strictly prohibited.
2.  **Statelessness:** The server must not store session state; all identity information must be derived from the JWT.
3.  **Input Validation:** Every API endpoint must have a corresponding Zod/Joi schema for request body and parameter validation.
4.  **Error Uniformity:** All API errors must return a `{ success: false, message: string, errors: [] }` format with appropriate HTTP status codes.
5.  **ORM Usage:** No raw SQL queries are permitted unless performance bottlenecks are demonstrated. Prisma is the source of truth for schema changes.
6.  **Real-Time Bridge:** Live updates (Dashboards/Notifications) must be event-driven. UI must not poll for updates.

---

## 4. 📁 Final Repository Structure & Standards

### 4.1 Folder Structure
```bash
/
├── client/                 # Frontend (Antigravity/React)
│   ├── src/
│   │   ├── components/     # Atomic UI units & Feature-specific blocks
│   │   ├── layouts/        # Page wrappers (Public vs App)
│   │   ├── pages/          # View components
│   │   ├── providers/      # Context (Auth, Query, Socket)
│   │   ├── services/       # API wrappers using TanStack Query
│   │   └── animations/     # Motion library configurations
├── server/                 # Backend (Antigravity Server/Node.js)
│   ├── src/
│   │   ├── controllers/    # Request/Response handling
│   │   ├── services/       # Business logic & Database interaction
│   │   ├── middlewares/    # Auth, RBAC, Validation, Error logging
│   │   ├── db/             # Prisma client & Schema
│   │   └── utils/          # Shared helpers
├── docs/                   # Frozen specifications and diagrams
├── .agent/                 # Workspace workflows
└── package.json            # Root workspace config
```

### 4.2 Coding Standards
- **Naming:** `PascalCase` for Components, `camelCase` for variables and functions, `kebab-case` for file names (where applicable).
- **Component Design:** Modular, pure components where possible. Logic extracted into custom hooks.
- **PR Requirement:** Every new feature must include a corresponding API definition in the `apiContract.md` if not already present.

---

## 5. 🏁 Final Approval

The system design is now **LOCKED**. Any deviation from this specification requires a formal architectural review.

**Architect Signature:**  
*Principal Software Architect*
