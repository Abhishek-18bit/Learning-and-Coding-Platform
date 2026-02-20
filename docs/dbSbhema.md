DATABASE SCHEMA README
Online Coding, Quiz & Interview Preparation Platform
1. DATABASE OVERVIEW

Database type: PostgreSQL
Hosting: NeonDB
ORM: Prisma

This database schema supports:

User authentication and role-based access

Courses and lessons

Coding problems and submissions

Quizzes and quiz attempts

Interview preparation tracking

Notifications and activity logs

All primary keys are UUIDs.
All timestamps use UTC.

2. USER ENTITY

Purpose: Stores all platform users (students and teachers).

Fields:

id: UUID, primary key, auto-generated

name: string, required

email: string, required, unique

password: string, required, hashed

role: enum (STUDENT, TEACHER)

createdAt: timestamp, default now

updatedAt: timestamp, auto-updated

Rules:

Email must be unique

Password must never be stored in plain text

Role determines access permissions

Relationships:

A teacher can create many courses

A student can enroll in many courses

A user can have many submissions

A user can have many quiz attempts

A user can have many interview progress records

A user can receive many notifications

A user can generate many activity logs

3. COURSE ENTITY

Purpose: Represents courses created by teachers.

Fields:

id: UUID, primary key

title: string, required

description: text

teacherId: UUID, foreign key referencing User.id

createdAt: timestamp, default now

Rules:

Only users with role TEACHER can create courses

Each course belongs to exactly one teacher

Relationships:

One course has many lessons

One course has many quizzes

One course has many enrollments

4. ENROLLMENT ENTITY

Purpose: Maps students to courses.

Fields:

id: UUID, primary key

userId: UUID, foreign key referencing User.id

courseId: UUID, foreign key referencing Course.id

enrolledAt: timestamp, default now

Rules:

A student can enroll in a course only once

Enforce uniqueness on (userId, courseId)

Relationships:

Each enrollment belongs to one user

Each enrollment belongs to one course

5. LESSON ENTITY

Purpose: Represents lessons inside a course.

Fields:

id: UUID, primary key

title: string, required

content: text

courseId: UUID, foreign key referencing Course.id

createdAt: timestamp, default now

Relationships:

Each lesson belongs to one course

Each lesson can have many coding problems

6. PROBLEM ENTITY

Purpose: Represents coding problems inside lessons.

Fields:

id: UUID, primary key

title: string, required

description: text

difficulty: enum (EASY, MEDIUM, HARD)

lessonId: UUID, foreign key referencing Lesson.id

createdAt: timestamp, default now

Relationships:

Each problem belongs to one lesson

Each problem can have many submissions

7. SUBMISSION ENTITY

Purpose: Stores coding submissions from students.

Fields:

id: UUID, primary key

userId: UUID, foreign key referencing User.id

problemId: UUID, foreign key referencing Problem.id

code: text

language: string

status: enum (PENDING, ACCEPTED, REJECTED)

createdAt: timestamp, default now

Rules:

Multiple submissions allowed per problem

Submission status is updated by code execution service

8. QUIZ ENTITY

Purpose: Represents quizzes created by teachers.

Fields:

id: UUID, primary key

title: string

courseId: UUID, foreign key referencing Course.id

timeLimit: integer (minutes)

totalMarks: integer

createdAt: timestamp, default now

Relationships:

Each quiz belongs to one course

Each quiz has many quiz questions

Each quiz has many quiz attempts

9. QUIZ QUESTION ENTITY

Purpose: Represents MCQ questions inside quizzes.

Fields:

id: UUID, primary key

quizId: UUID, foreign key referencing Quiz.id

question: text

options: JSON array

correctOption: string

marks: integer

Rules:

Options must be stored as structured JSON

Evaluation logic handled at backend

10. QUIZ ATTEMPT ENTITY

Purpose: Tracks student attempts on quizzes.

Fields:

id: UUID, primary key

quizId: UUID, foreign key referencing Quiz.id

userId: UUID, foreign key referencing User.id

score: integer

startedAt: timestamp

submittedAt: timestamp

Rules:

A student may attempt a quiz multiple times (configurable)

11. INTERVIEW QUESTION ENTITY

Purpose: Stores interview preparation questions.

Fields:

id: UUID, primary key

title: string

content: text

category: string (DSA, DBMS, OS, etc.)

createdAt: timestamp, default now

12. INTERVIEW PROGRESS ENTITY

Purpose: Tracks completion of interview questions by students.

Fields:

id: UUID, primary key

userId: UUID, foreign key referencing User.id

interviewQuestionId: UUID, foreign key referencing InterviewQuestion.id

completed: boolean

completedAt: timestamp

Rules:

Each record tracks one user and one interview question

13. NOTIFICATION ENTITY

Purpose: Stores in-app notifications.

Fields:

id: UUID, primary key

userId: UUID, foreign key referencing User.id

message: text

read: boolean

createdAt: timestamp, default now

14. ACTIVITY LOG ENTITY

Purpose: Tracks user actions and system events.

Fields:

id: UUID, primary key

userId: UUID, foreign key referencing User.id

action: string

metadata: JSON

createdAt: timestamp, default now

15. RELATIONSHIP HIERARCHY

User

Courses (as Teacher)

Enrollments (as Student)

Submissions

Quiz Attempts

Interview Progress

Notifications

Activity Logs

Course

Lessons

Quizzes

Enrollments

Lesson

Problems

Quiz

Quiz Questions

16. AI AGENT BUILD INSTRUCTIONS

The AI agent must:

Create Prisma models exactly as defined above

Use UUIDs for all primary keys

Enforce foreign key constraints

Implement enums exactly as specified

Add indexes for foreign keys and email

Enforce role-based access using User.role

Ensure schema is migration-safe and extensible