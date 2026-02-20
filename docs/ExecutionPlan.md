# Project Execution Roadmap

## 1. Project Milestones

### 🏗️ Milestone 1: Foundation & Core Learning (MVP)
**Objective:** Establish the authentication layer and the core hierarchical content structure (Courses → Lessons → Problems).
*   **Target:** A functional student-teacher environment where courses can be created and code can be submitted.

### 🧪 Milestone 2: Assessment & Real-Time Engagement (Beta)
**Objective:** Implement assessment modules (Quizzes, Interview Questions) and the real-time notification engine.
*   **Target:** A fully interactive platform with timed evaluations and live status updates.

### 📈 Milestone 3: Analytics & UX Polish (Scale)
**Objective:** Develop comprehensive dashboards, advanced analytics, and high-fidelity animations.
*   **Target:** A production-ready platform with optimized performance and premium visual feedback.

---

## 2. Task Breakdown per Milestone

### 📍 Milestone 1: MVP
| Category | Backend Tasks | Frontend Tasks |
| :--- | :--- | :--- |
| **Auth** | Implement JWT-based RBAC & Middleware | Build Login/Register pages & `AuthProvider` |
| **Course** | CRUD APIs for Courses & Lessons | Build `CourseListPage` & `CourseDetailPage` |
| **Coding** | Problem CRUD & Submission persistence logic | Integrate `Monaco Editor` & Problem description UI |
| **Shared** | Setup PostgreSQL (NeonDB) & Prisma Schema | Initialize Design System (Tailwind + Shared Components) |

### 📍 Milestone 2: Beta
| Category | Backend Tasks | Frontend Tasks |
| :--- | :--- | :--- |
| **Quiz** | Timed Quiz logic & Auto-evaluation engine | Build `QuizPage` with Timer & Question navigation |
| **Interview** | Interview Question Management APIs | Build `InterviewPrepPage` with Category filters |
| **Real-time** | WebSocket/SSE integration for live events | Implement `SocketProvider` & `NotificationBell` |
| **Activity** | Activity Logging & Event monitoring | Build `ActivityList` & Basic `StudentDashboard` |

### 📍 Milestone 3: Scale
| Category | Backend Tasks | Frontend Tasks |
| :--- | :--- | :--- |
| **Analytics** | Aggregated data APIs for Student/Teacher stats | Implement `AnalyticsChart` & `MetricCard` animations |
| **UX/UI** | Advanced Search, Filter, & Pagination | Implement Fluid/Motion entry/exit animations |
| **Perf** | Query optimization & Indexing | Skeleton loading states & Client-side caching (Query) |

---

## 3. Task Dependencies

To ensure a smooth delivery, the following critical path must be followed:

1.  **Database & Auth (Blocker):** Backend Auth & Prisma Schema must be finalized before any feature work begins on Student/Teacher modules.
2.  **API → UI Flow:** All Feature Components (e.g., `QuizPage`) depend on the completion of their respective API Endpoints (e.g., `/api/quizzes`).
3.  **Real-Time Bridge:** The `SocketProvider` on the frontend requires the WebSocket event emitters to be functional in the Backend Application Layer.
4.  **Analytics:** The Dashboard logic depends on a populated `ActivityLog` and `SubmissionHistory` database.

---

## 4. Proposed Repository Structure

```bash
/
├── client/                 # Frontend: Antigravity (React + TS)
│   ├── src/
│   │   ├── components/     # Shared (Button, Input) & Feature (Editor)
│   │   ├── layouts/        # AppLayout, PublicLayout
│   │   ├── pages/          # Student, Teacher, and Auth views
│   │   ├── providers/      # Auth, Query, and Socket contexts
│   │   ├── hooks/          # Custom business logic hooks
│   │   ├── services/       # API integration (TanStack Query)
│   │   └── animations/     # Fluid/Motion configuration
│   └── public/             # Static assets
├── server/                 # Backend: Antigravity Server (Node.js + TS)
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic layer
│   │   ├── routes/         # API endpoint definitions
│   │   ├── middlewares/    # Auth (RBAC), Validation (Zod)
│   │   ├── db/             # Prisma Schema & Client
│   │   └── socket/         # WebSocket/SSE Event logic
├── docs/                   # PRD, Architecture, and Technical Docs
├── .agent/                 # Workflows and AI instructions
├── package.json            # Workspace definitions
└── tsconfig.json           # Shared base TS configuration
```
