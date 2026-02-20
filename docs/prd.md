# 📘 Product Requirements Document (PRD v2)
## Online Coding, Quiz & Interview Preparation Platform

---

## 1. 📌 Product Overview

This project is a full-stack e-learning platform designed to support structured learning, coding practice, quizzes, and interview preparation within a single system.

Teachers can create and manage courses, quizzes, and interview preparation material, while students can learn, practice coding, attempt assessments, and track their progress through real-time dashboards.

The platform emphasizes:
- Clean and modern UI/UX
- Smooth and meaningful interactions
- Scalable backend architecture
- Modern full-stack development practices

---

## 2. 🎯 Product Goals

The primary goals of the platform are:
- To provide an integrated learning, practice, and assessment environment
- To ensure a modern, engaging, and smooth user experience
- To enable real-time progress tracking for students and teachers
- To maintain a clean separation between frontend, backend, and database layers

---

## 3. 👥 User Roles

### Student
- Learns from structured courses
- Practices coding problems
- Attempts quizzes and interview questions
- Tracks learning progress and performance

### Teacher
- Creates and manages courses and lessons
- Designs quizzes and interview preparation content
- Tracks student performance and analytics

---

## 4. 🧩 Functional Requirements

The following core functionalities are included in the platform:

- Authentication and authorization using JWT with role-based access control (RBAC)
- Hierarchical content structure: Courses → Lessons → Problems
- Online code editor with code submissions
- Quiz system with MCQs, time limits, and automatic evaluation
- Interview questions module
- Real-time dashboards for students and teachers
- Analytics and progress tracking
- Notifications system
- Activity logging
- Search, filtering, and pagination
- Robust error handling and UX states

---

## 5. 🎨 UI / UX Requirements

The UI and UX of the platform follow modern educational design principles inspired by LEARNme-style interfaces.

Key requirements include:
- Clean, modern educational UI
- Multi-section landing page
- Card-based layouts
- Gradient call-to-action buttons
- Soft shadows and rounded UI components
- Fully responsive design across devices
- Smooth and meaningful animations for interaction feedback

---

## 6. 🛠️ Technology & Language Stack

### 6.1 Frontend Stack

The frontend is built using the following technologies:
- Framework: Antigravity (React-based)
- Programming language: TypeScript
- Markup language: HTML
- Styling: Tailwind CSS
- Animations: Fluid / Motion library
- State management: TanStack Query
- Real-time UI updates: WebSockets or Server-Sent Events (SSE)
- Code editor: Monaco Editor
- Data exchange format: JSON

---

### 6.2 Backend Stack

The backend architecture includes:
- Runtime environment: Node.js
- Backend framework: Antigravity Server
- Programming language: TypeScript
- API style: REST
- Authentication: JWT
- Authorization: RBAC middleware
- Input validation: Zod or Joi
- Real-time engine: WebSockets or Server-Sent Events (SSE)
- Data format: JSON

---

### 6.3 Database Stack

The data layer is implemented using:
- Database engine: PostgreSQL
- Database hosting: NeonDB
- ORM: Prisma
- Query language: SQL

---

## 7. 🧪 Development Methodology

The project follows an iterative and modular full-stack development approach.

Key practices include:
- Component-driven UI development
- API-first backend design
- Clear separation of concerns across layers

### Use of AI Agent

An Antigravity AI agent is used strictly as a development assistant for:
- Code scaffolding
- Boilerplate generation
- Productivity enhancement

All architectural decisions, logic design, and validations are performed by the developer.

---

## 8. 🚫 Out of Scope

The following features are intentionally excluded from the current scope:
- Payment processing
- Email notifications
- Certificates
- Mobile application
- AI-based code evaluation

---

## 9. 🔮 Future Enhancements

Potential future improvements include:
- Leaderboards
- Admin panel
- Code execution with test cases
- Cloud deployment and scaling

---

## 10. 🏁 Conclusion

This Product Requirements Document (PRD v2) fully defines the functional scope, UI expectations, and complete technology stack of the platform. It is aligned with the corresponding Technical Design Document and is suitable for academic submission, interviews, and real-world project evaluation.

---

---
