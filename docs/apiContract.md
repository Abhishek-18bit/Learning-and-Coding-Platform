API Contract – LEARNme / TDD Style README
Project Name

Online Coding, Quiz & Interview Preparation Platform

1. 📌 API Design Principles

RESTful API architecture

JSON request and response format

JWT-based authentication

Role-Based Access Control (RBAC)

Consistent response structure

Pagination support for list APIs

Secure and scalable design

2. 🔐 Authentication & Authorization

Authentication uses JWT tokens

Authorization is role-based:

STUDENT

TEACHER

Protected APIs require Authorization header

Header format:

Authorization: Bearer <JWT_TOKEN>

3. 🔑 Authentication APIs
3.1 Register User

Endpoint:
POST /api/auth/register

Purpose:

Register a new user on the platform

Request includes:

name

email

password

role (STUDENT / TEACHER)

Response:

Success confirmation message

3.2 Login User

Endpoint:
POST /api/auth/login

Purpose:

Authenticate user and issue JWT token

Request includes:

email

password

Response includes:

JWT token

user id

user name

user role

4. 👤 User APIs
4.1 Get Current User

Endpoint:
GET /api/users/me

Access:

Authenticated users only

Purpose:

Fetch current logged-in user profile

Response includes:

id

name

email

role

5. 📚 Course APIs
5.1 Create Course

Endpoint:
POST /api/courses

Access:

Teacher only

Purpose:

Create a new course

Request includes:

title

description

5.2 Get All Courses

Endpoint:
GET /api/courses

Features:

Pagination using page and limit

Purpose:

Fetch all available courses

5.3 Get Course by ID

Endpoint:
GET /api/courses/{courseId}

Purpose:

Fetch details of a single course

6. 🧩 Enrollment APIs
6.1 Enroll in Course

Endpoint:
POST /api/enrollments

Access:

Student only

Purpose:

Enroll a student into a course

Request includes:

courseId

7. 📘 Lesson APIs
7.1 Create Lesson

Endpoint:
POST /api/lessons

Access:

Teacher only

Purpose:

Create a lesson inside a course

Request includes:

courseId

title

content

7.2 Get Lessons by Course

Endpoint:
GET /api/courses/{courseId}/lessons

Purpose:

Fetch lessons for a course

8. 💻 Problem APIs
8.1 Create Problem

Endpoint:
POST /api/problems

Access:

Teacher only

Purpose:

Create a coding problem

Request includes:

lessonId

title

description

difficulty (EASY / MEDIUM / HARD)

8.2 Get Problems by Lesson

Endpoint:
GET /api/lessons/{lessonId}/problems

Purpose:

Fetch problems under a lesson

9. 🧾 Submission APIs
9.1 Submit Code

Endpoint:
POST /api/submissions

Access:

Student only

Purpose:

Submit code for a problem

Request includes:

problemId

language

code

9.2 Get My Submissions

Endpoint:
GET /api/submissions/me

Purpose:

Fetch logged-in user submissions

10. 📝 Quiz APIs
10.1 Create Quiz

Endpoint:
POST /api/quizzes

Access:

Teacher only

Purpose:

Create a quiz for a course

Request includes:

courseId

title

timeLimit

totalMarks

10.2 Add Quiz Question

Endpoint:
POST /api/quizzes/{quizId}/questions

Purpose:

Add MCQ questions to quiz

Request includes:

question

options

correctOption

marks

10.3 Attempt Quiz

Endpoint:
POST /api/quizzes/{quizId}/attempt

Access:

Student only

Purpose:

Attempt a quiz

Request includes:

selected answers

11. 🎯 Interview Preparation APIs
11.1 Create Interview Question

Endpoint:
POST /api/interview-questions

Access:

Teacher only

Purpose:

Create interview preparation question

Request includes:

title

content

category

11.2 Get Interview Questions

Endpoint:
GET /api/interview-questions

Features:

Category filter

Search

Pagination

Purpose:

Fetch interview questions

11.3 Mark Interview Question Completed

Endpoint:
POST /api/interview-progress

Purpose:

Mark interview question as completed

Request includes:

interviewQuestionId

12. 📊 Dashboard APIs
12.1 Student Dashboard

Endpoint:
GET /api/dashboard/student

Purpose:

View student progress and analytics

Includes:

courses enrolled

problems solved

quiz average

interview progress

12.2 Teacher Dashboard

Endpoint:
GET /api/dashboard/teacher

Purpose:

View teacher analytics and insights

13. 🔔 Notification APIs
13.1 Get Notifications

Endpoint:
GET /api/notifications

Purpose:

Fetch user notifications

13.2 Mark Notification as Read

Endpoint:
PATCH /api/notifications/{id}/read

Purpose:

Mark notification as read

14. 📊 Activity Log APIs
14.1 Get My Activity Logs

Endpoint:
GET /api/activity-logs/me

Purpose:

Fetch activity logs of logged-in user

15. ⚠️ Error Handling

All errors follow a consistent structure

Error responses include:

success = false

meaningful error message

16. 🏁 Summary

Fully REST-compliant API

Secure with JWT & RBAC

Covers all platform features

Cleanly maps to database schema

Ready for AI-agent–driven backend generation