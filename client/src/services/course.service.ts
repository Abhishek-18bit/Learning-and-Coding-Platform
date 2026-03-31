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
        content?: string;
        unitId?: string | null;
        createdAt: string;
    }[];
    units?: {
        id: string;
        title: string;
        sortOrder: number;
        estimatedHours?: number | null;
        topics: {
            id: string;
            title: string;
            sortOrder: number;
            estimatedMinutes?: number | null;
            lessonId?: string | null;
            lesson?: {
                id: string;
                title: string;
                content?: string | null;
                createdAt: string;
            } | null;
        }[];
    }[];
}

export interface CourseTopic {
    id: string;
    title: string;
    sortOrder: number;
    estimatedMinutes?: number | null;
    createdAt?: string;
    updatedAt?: string;
    lessonId?: string | null;
    lesson?: {
        id: string;
        title: string;
        content?: string | null;
        createdAt: string;
    } | null;
}

export interface CourseUnit {
    id: string;
    title: string;
    sortOrder: number;
    estimatedHours?: number | null;
    topics: CourseTopic[];
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

    getUnits: async (courseId: string) => {
        const response = await api.get<{
            success: boolean;
            units: CourseUnit[];
        }>(`/courses/${courseId}/units`);
        return response.data.units;
    },

    create: async (data: { title: string; description: string }) => {
        const response = await api.post<{
            success: boolean;
            course: Course
        }>(`/courses`, data);
        return response.data.course;
    },

    createUnit: async (courseId: string, data: { title: string; sortOrder?: number; estimatedHours?: number }) => {
        const response = await api.post<{
            success: boolean;
            unit: CourseUnit;
        }>(`/courses/${courseId}/units`, data);
        return response.data.unit;
    },

    createTopic: async (
        courseId: string,
        unitId: string,
        data: { title: string; lessonId?: string; sortOrder?: number; estimatedMinutes?: number }
    ) => {
        const response = await api.post<{
            success: boolean;
            topic: CourseTopic;
        }>(`/courses/${courseId}/units/${unitId}/topics`, data);
        return response.data.topic;
    },

    reorderUnits: async (courseId: string, unitIds: string[]) => {
        await api.patch(`/courses/${courseId}/units/reorder`, { unitIds });
    },

    reorderTopics: async (courseId: string, unitId: string, topicIds: string[]) => {
        await api.patch(`/courses/${courseId}/units/${unitId}/topics/reorder`, { topicIds });
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

    remove: async (courseId: string) => {
        await api.delete(`/courses/${courseId}`);
    },

    getEnrolledStudents: async (courseId: string) => {
        const response = await api.get<{
            success: boolean;
            students: EnrolledStudent[];
        }>(`/courses/${courseId}/students`);
        return response.data.students;
    },
};
