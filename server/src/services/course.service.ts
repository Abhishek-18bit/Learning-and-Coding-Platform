import { Course } from '@prisma/client';
import prisma from '../db/prisma';
import { ApiError } from '../utils/errors';

interface EnrolledStudentRow {
    id: string;
    name: string;
    email: string;
    enrolledAt: Date;
    quizAttempts: number;
    averageScore: number;
}

export class CourseService {
    static async create(data: { title: string; description?: string; teacherId: string }): Promise<Course> {
        return prisma.course.create({
            data: {
                title: data.title,
                description: data.description,
                teacherId: data.teacherId,
            },
        });
    }

    static async findAll(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                skip,
                take: limit,
                include: {
                    teacher: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            lessons: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.course.count(),
        ]);

        return {
            courses,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    static async findById(id: string): Promise<Course | null> {
        return prisma.course.findUnique({
            where: { id },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                lessons: {
                    select: {
                        id: true,
                        title: true,
                        createdAt: true,
                    },
                },
            },
        });
    }

    static async isStudentEnrolled(courseId: string, userId: string): Promise<boolean> {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            select: { id: true },
        });

        return Boolean(enrollment);
    }

    static async enrollStudent(courseId: string, userId: string) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true },
        });

        if (!course) {
            throw new ApiError(404, 'Course not found');
        }

        const existing = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            select: { id: true },
        });

        if (existing) {
            throw new ApiError(409, 'You are already enrolled in this course');
        }

        return prisma.enrollment.create({
            data: { userId, courseId },
        });
    }

    static async unenrollStudent(courseId: string, userId: string) {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            select: { id: true },
        });

        if (!enrollment) {
            throw new ApiError(404, 'You are not enrolled in this course');
        }

        return prisma.enrollment.delete({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });
    }

    static async getEnrolledStudents(
        courseId: string,
        requesterId: string,
        requesterRole: string
    ): Promise<EnrolledStudentRow[]> {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                teacherId: true,
            },
        });

        if (!course) {
            throw new ApiError(404, 'Course not found');
        }

        if (requesterRole !== 'ADMIN' && course.teacherId !== requesterId) {
            throw new ApiError(403, 'Forbidden: You do not have permission to view enrolled students for this course');
        }

        const [enrollments, attemptStats] = await Promise.all([
            prisma.enrollment.findMany({
                where: { courseId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: { enrolledAt: 'desc' },
            }),
            prisma.quizAttempt.groupBy({
                by: ['userId'],
                where: {
                    submittedAt: { not: null },
                    quiz: { courseId },
                },
                _count: { _all: true },
                _avg: { score: true },
            }),
        ]);

        const attemptByUserId = new Map(
            attemptStats.map((row) => [
                row.userId,
                {
                    quizAttempts: row._count._all,
                    averageScore: Math.round(row._avg.score || 0),
                },
            ])
        );

        return enrollments.map((enrollment) => {
            const stats = attemptByUserId.get(enrollment.userId) || {
                quizAttempts: 0,
                averageScore: 0,
            };

            return {
                id: enrollment.user.id,
                name: enrollment.user.name,
                email: enrollment.user.email,
                enrolledAt: enrollment.enrolledAt,
                quizAttempts: stats.quizAttempts,
                averageScore: stats.averageScore,
            };
        });
    }
}
