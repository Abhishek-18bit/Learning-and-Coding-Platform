import api from './api';

export interface StudentDashboardData {
    coursesEnrolled: number;
    problemsSolved: number;
    streakDays: number;
    quizAverage: number;
    interviewProgress: number;
    enrolledCourses: {
        id: string;
        title: string;
    }[];
    recentActivity: {
        id: string;
        text: string;
        createdAt: string;
    }[];
    continueLearning: {
        id: string;
        title: string;
        progress: number;
        nextLesson: string;
    }[];
    courseProgress?: {
        courseId: string;
        courseTitle: string;
        solvedProblems: number;
        attemptedProblems: number;
        totalProblems: number;
        completionPercent: number;
    }[];
}

export interface TeacherDashboardData {
    totalCourses: number;
    totalStudents: number;
    totalSubmissions: number;
    activeStudents: number;
    courses: {
        id: string;
        title: string;
        studentCount: number;
        lessonCount: number;
    }[];
    recentSubmissions: {
        id: string;
        studentName: string;
        problemTitle: string;
        status: string;
        createdAt: string;
    }[];
}

export interface PlatformStatsData {
    totalCourses: number;
    totalProblems: number;
    totalQuizzes: number;
    totalBattleRooms: number;
    totalStudents: number;
    totalTeachers: number;
    aiGeneratedQuizzes: number;
    totalSubmissions: number;
}

export const dashboardService = {
    getStudentData: async () => {
        const response = await api.get<{ success: boolean; data: StudentDashboardData }>('/dashboard/student');
        return response.data.data;
    },
    getTeacherData: async () => {
        const response = await api.get<{ success: boolean; data: TeacherDashboardData }>('/dashboard/teacher');
        return response.data.data;
    },
    getPlatformStats: async () => {
        const response = await api.get<{ success: boolean; data: PlatformStatsData }>('/dashboard/platform-stats');
        return response.data.data;
    },
};
