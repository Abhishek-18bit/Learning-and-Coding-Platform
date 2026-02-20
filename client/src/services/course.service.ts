import api from './api';

export interface Course {
    id: string;
    title: string;
    description?: string;
    teacherId: string;
    teacher?: {
        id: string;
        name: string;
    };
    createdAt: string;
    _count?: {
        lessons: number;
    };
}

export interface CourseDetail extends Course {
    lessons: {
        id: string;
        title: string;
        createdAt: string;
    }[];
}

export interface Enrollment {
    id: string;
    userId: string;
    courseId: string;
    enrolledAt: string;
}

export interface EnrolledStudent {
    id: string;
    name: string;
    email: string;
    enrolledAt: string;
    quizAttempts: number;
    averageScore: number;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const courseService = {
    getAll: async (page = 1, limit = 10) => {
        const response = await api.get<{
            success: boolean;
            courses: Course[];
            pagination: Pagination
        }>(`/courses`, {
            params: { page, limit }
        });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<{
            success: boolean;
            course: CourseDetail
        }>(`/courses/${id}`);
        return response.data.course;
    },

    create: async (data: { title: string; description: string }) => {
        const response = await api.post<{
            success: boolean;
            course: Course
        }>(`/courses`, data);
        return response.data.course;
    },

    enroll: async (courseId: string) => {
        const response = await api.post<{
            success: boolean;
            enrollment: Enrollment;
        }>(`/courses/${courseId}/enroll`);
        return response.data.enrollment;
    },

    unenroll: async (courseId: string) => {
        await api.delete(`/courses/${courseId}/enroll`);
    },

    getEnrolledStudents: async (courseId: string) => {
        const response = await api.get<{
            success: boolean;
            students: EnrolledStudent[];
        }>(`/courses/${courseId}/students`);
        return response.data.students;
    },
};
