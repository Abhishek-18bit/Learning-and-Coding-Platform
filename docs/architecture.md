# 📕 System Architecture Document
## Online Coding, Quiz & Interview Preparation Platform

---

## 1. 📌 Purpose of This Document

This System Architecture Document describes the overall structure of the platform, its major components, data flow, and interaction patterns.

It focuses on:
- High-level system design
- Component responsibilities
- Communication between layers
- Scalability and security considerations

This document answers the question:
**“How is the system built and how do its parts communicate with each other?”**

---

## 2. 🏗️ Architectural Overview

### Architecture Style

The platform follows a combination of:
- Client–Server architecture
- Layered architecture
- API-driven design
- Event-assisted real-time updates

---

### High-Level Architecture (Conceptual)

Frontend  
Antigravity (React + TypeScript)  
Tailwind CSS with animations  

↓ REST APIs / WebSockets  

Backend  
Antigravity Server  
Node.js with TypeScript  

↓ Prisma ORM  

Database  
PostgreSQL hosted on NeonDB  

---

## 3. 🧩 Architectural Layers

### 3.1 Presentation Layer (Frontend)

**Responsibilities**
- Render UI components and layouts
- Handle routing and navigation
- Manage user interactions
- Display real-time updates
- Provide smooth and responsive animations

**Technologies**
- Antigravity (React-based framework)
- TypeScript
- HTML
- Tailwind CSS
- Fluid / Motion animation library
- TanStack Query
- WebSockets or Server-Sent Events (SSE)

**Key Characteristics**
- Component-based UI architecture
- Fully responsive design
- Role-aware UI rendering (Student / Teacher)
- Client-side caching
- Optimistic UI updates

---

### 3.2 Application Layer (Backend)

**Responsibilities**
- Handle core business logic
- Authenticate and authorize users
- Expose REST APIs
- Process quizzes and code submissions
- Manage real-time events
- Validate and sanitize incoming data

**Technologies**
- Antigravity Server
- Node.js
- TypeScript
- JWT-based authentication
- Role-Based Access Control (RBAC) middleware
- WebSockets or Server-Sent Events (SSE)

**Backend Structure**
server/
- controllers/
- services/
- routes/
- middlewares/
- validators/
- utils/

---

### 3.3 Data Layer (Database)

**Responsibilities**
- Persist application data
- Maintain relational integrity
- Support analytics and reporting queries
- Store progress data and activity logs

**Technologies**
- PostgreSQL
- NeonDB for database hosting
- Prisma ORM
- SQL

**Data Characteristics**
- Strong relational structure using foreign keys
- Normalized database schema
- Transaction support
- Indexed queries for performance optimization

---

## 4. 🔐 Authentication & Authorization Architecture

### Authentication Flow

- User sends login request
- Backend validates credentials
- JWT token is generated
- Token is stored client-side
- Token is attached to subsequent API requests

### Authorization

- Role-Based Access Control (RBAC)
- Enforced at API level
- Reflected at UI level through conditional rendering

**User Roles**
- Student
- Teacher

---

## 5. 📚 Core Module Architecture

### Course & Learning Module
- Manages courses, lessons, and problems
- Enforces enrollment rules
- Supports hierarchical content structure

### Coding & Submission Module
- Handles code submissions
- Stores submission history
- Links submissions to users and problems

### Quiz & Assessment Module
- Quiz creation by teachers
- Timed quiz attempts by students
- Automatic evaluation logic
- Score calculation and persistence

### Interview Preparation Module
- Categorized interview questions
- Completion tracking
- Search and filtering
- Analytics support

### Dashboard & Analytics Module
- Aggregates user progress data
- Calculates performance metrics
- Sends real-time updates to the UI

### Notification & Activity Module
- Event-based notifications
- Activity logging with timestamps
- Used for analytics and debugging

---

## 6. 🔄 Real-Time Architecture

**Purpose**
- Live progress updates
- Dashboard synchronization
- Instant feedback for user actions

**Design Flow**
- Event triggered in backend
- Backend emits real-time event
- Event broadcast via WebSocket
- Frontend updates UI instantly

**Used For**
- Quiz completion
- Problem solved events
- Interview question completion
- Analytics and dashboard refresh

---

## 7. ⚠️ Error Handling Architecture

### Backend Error Handling
- Centralized error handling mechanism
- Consistent error response format
- Proper HTTP status code usage

### Frontend Error Handling
- Loading and skeleton states
- User-friendly error messages
- Retry options for recoverable errors
- Disabled UI states on failure

---

## 8. 🎨 UI & Animation Architecture

- All animations are handled in the frontend layer
- Motion is tied to user interaction and data changes
- Animations do not affect business logic

**Examples**
- Card entry animations
- Progress bar transitions
- Hover and focus feedback

---

## 9. 🧪 Development Architecture (AI Agent Usage)

### Development Approach
- Iterative and modular development
- Feature-based implementation strategy

### AI Agent Role
- Used for code scaffolding and boilerplate generation
- Does not control architecture or decision-making
- Developer retains full ownership of logic and design

---

## 10. 🔐 Security Architecture

- Encrypted password storage
- Secure JWT handling
- API-level input validation middleware
- Role-based UI rendering
- SQL injection prevention via ORM usage

---

## 11. 📈 Scalability Considerations

- Stateless backend services
- Normalized database schema
- Pagination and request limits
- Modular service design
- Architecture ready for horizontal scaling

---

## 12. 🚫 Architectural Constraints

- Local development environment only
- No external payment gateways
- No email systems
- No mobile application in current scope

---

## 13. 🔮 Future Architecture Extensions

- Sandboxed code execution engine
- Admin service
- Microservice-based architecture
- Cloud deployment
- Caching layer using Redis

---

## 14. 🏁 Conclusion

This system architecture provides a clean, scalable, and maintainable foundation for the e-learning platform. It follows industry best practices, supports real-time features, and aligns with modern full-stack development standards.

---
