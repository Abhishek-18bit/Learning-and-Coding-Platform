# Course Materials API

## Overview
This API allows teachers to upload, retrieve, and manage PDF materials for their courses.

## Base URL
`/api`

## Authentication
All endpoints require a valid JWT token in the header:
`Authorization: Bearer <token>`

---

## Endpoints

### 1. Get Course Materials
Retrieve all materials uploaded for a specific course.

- **URL:** `/courses/:courseId/materials`
- **Method:** `GET`
- **Access:** Authenticated Users (Student, Teacher, Admin)
- **Response:**
  ```json
  {
      "success": true,
      "data": [
          {
              "id": "uuid",
              "title": "Lecture Notes",
              "fileUrl": "uploads/1234567890-notes.pdf",
              "fileType": "application/pdf",
              "uploadedBy": "teacher-uuid",
              "createdAt": "2023-10-27T10:00:00.000Z",
              "uploader": {
                  "id": "teacher-uuid",
                  "name": "John Doe"
              }
          }
      ]
  }
  ```

### 2. Upload Material
Upload a PDF file to a course.

- **URL:** `/courses/:courseId/materials`
- **Method:** `POST`
- **Access:** Teacher, Admin
- **Content-Type:** `multipart/form-data`
- **Body Parameters:**
  - `file`: The PDF file (Max 10MB)
  - `title` (optional): Title of the material. Defaults to filename if not provided.
- **Response:**
  ```json
  {
      "success": true,
      "data": {
          "id": "uuid",
          "title": "Lecture Notes.pdf",
          "fileUrl": "uploads/1234567890-notes.pdf",
          "fileType": "application/pdf",
          "courseId": "course-uuid",
          "uploadedBy": "teacher-uuid",
          "createdAt": "2023-10-27T10:00:00.000Z"
      }
  }
  ```
- **Errors:**
  - `400`: File missing, invalid type (not PDF), or file too large.

### 3. Delete Material
Remove a material.

- **URL:** `/materials/:id`
- **Method:** `DELETE`
- **Access:** Teacher (Uploader only), Admin
- **Response:**
  ```json
  {
      "success": true,
      "message": "Material deleted successfully"
  }
  ```
