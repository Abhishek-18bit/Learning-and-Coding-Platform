1. 📌 Purpose of This Document

This document defines the frontend component architecture of the platform.

It clearly describes:

All major frontend components

Responsibilities of each component

Component hierarchy and organization

Data sources (APIs) consumed by components

Reusability across the application

Component Map answers one key question:
“What components exist and how are they organized?”

This document is intended for:

Frontend developers

UI/UX designers

AI agents generating UI code

Reviewers and interview evaluations

2. 🏗️ Component Hierarchy Overview

High-level application structure:

App
├── Providers
│ ├── AuthProvider
│ ├── QueryProvider
│ └── SocketProvider
│
├── Layouts
│ ├── PublicLayout
│ └── AppLayout
│
├── Pages
│ ├── Auth Pages
│ ├── Student Pages
│ └── Teacher Pages
│
├── Shared Components
│
└── Feature Components

3. 🧠 Core Providers (Global)
3.1 AuthProvider

Responsibility:

Manage authentication state

Store logged-in user data

Store user role

Handle login and logout

Used by:

All protected routes and pages

3.2 QueryProvider

Responsibility:

API data fetching

Caching responses

Background refetching

Synchronizing server state

Library Used:

TanStack Query

3.3 SocketProvider

Responsibility:

Manage WebSocket or SSE connections

Push real-time updates to UI

Handle live notifications and dashboard updates

4. 🧱 Layout Components
4.1 PublicLayout

Used for:

Landing page

Login page

Register page

Contains:

Navbar

Footer

Main content outlet

4.2 AppLayout

Used for:

Student dashboard

Teacher dashboard

All authenticated pages

Contains:

Sidebar

Topbar

Main content area

5. 📄 Page-Level Components
5.1 Public Pages
LandingPage

Child components:

HeroSection

FeatureSection

HowItWorks

StatsSection

CTASection

LoginPage

Child components:

AuthForm

Input

Button

ErrorMessage

RegisterPage

Child components:

AuthForm

RoleSelector

Input

Button

5.2 Student Pages
StudentDashboard

Widgets:

MetricCard

ProgressBar

RecentActivityList

NotificationList

APIs consumed:

/api/dashboard/student

/api/notifications

CourseListPage

Child components:

CourseCard

SearchBar

Pagination

CourseDetailPage

Child components:

LessonList

CourseProgress

LessonPage

Child components:

LessonContent

ProblemList

ProblemPage

Child components:

ProblemDescription

CodeEditor

LanguageSelector

SubmitButton

SubmissionStatus

QuizPage

Child components:

QuizHeader

Timer

QuestionCard

OptionSelector

SubmitQuizButton

InterviewPrepPage

Child components:

CategoryFilter

InterviewQuestionList

InterviewQuestionCard

5.3 Teacher Pages
TeacherDashboard

Child components:

MetricCard

AnalyticsChart

RecentSubmissions

CreateCoursePage

Child components:

CourseForm

CreateLessonPage

Child components:

LessonForm

CreateProblemPage

Child components:

ProblemForm

CreateQuizPage

Child components:

QuizForm

QuizQuestionForm

InterviewQuestionManager

Child components:

InterviewQuestionForm

InterviewQuestionTable

6. 🧩 Feature-Specific Components
6.1 Code Editor Components

Includes:

CodeEditor (Monaco)

EditorToolbar

RunButton

SubmitButton

6.2 Dashboard Components

Includes:

MetricCard

AnimatedCounter

ProgressBar

AnalyticsChart

6.3 Notification Components

Includes:

NotificationBell

NotificationDropdown

NotificationItem

6.4 Activity Log Components

Includes:

ActivityList

ActivityItem

7. 🔁 Shared / Reusable Components

Reusable across the entire application:

Button

Input

Modal

Card

Loader

EmptyState

Toast

Tabs

Badge

Used in:

Forms

Dashboards

Lists

Confirmation flows

Feedback and status displays

8. 🎨 Animation-Enabled Components

The following components include motion or fluid animations:

HeroSection (fade and scale)

MetricCard (count-up animation)

CourseCard (hover lift)

ProgressBar (fill animation)

Modal (scale and fade)

NotificationItem (slide-in)

Animation principles:

Subtle

Purpose-driven

GPU-friendly

Non-distracting

9. 🔐 Role-Based Rendering Map

Role-based component visibility:

StudentDashboard → Student only

TeacherDashboard → Teacher only

CreateCoursePage → Teacher only

QuizAttempt components → Student only

QuizCreation components → Teacher only

Enforcement layers:

UI rendering logic

Route protection

Backend API validation

10. 🧠 Data → Component Mapping

API endpoints mapped to UI components:

/auth/login → AuthForm

/courses → CourseListPage

/lessons → LessonPage

/problems → ProblemPage

/submissions → SubmissionStatus

/quizzes → QuizPage

/dashboard/* → Dashboards

/notifications → NotificationDropdown

11. 🏁 Summary

This Component Map:

Clearly defines what components to build

Prevents UI duplication

Improves long-term maintainability

Makes frontend implementation systematic

Is interview, review, and AI-agent friendly