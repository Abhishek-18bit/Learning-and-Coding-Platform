import { Course, Prisma } from '@prisma/client';
import prisma from '../db/prisma';
import { ApiError } from '../utils/errors';
import { AchievementService } from './achievement.service';
import fs from 'fs';
import path from 'path';

interface EnrolledStudentRow {
    id: string;
    name: string;
    email: string;
    enrolledAt: Date;
    quizAttempts: number;
    averageScore: number;
}

export class CourseService {
    private static readonly HIERARCHY_MIGRATION_MESSAGE =
        'Course unit/topic schema is not ready in the database. Auto-setup failed; run `npm --prefix server run migrate:deploy` and restart the server.';
    private static readonly HIERARCHY_CLIENT_MESSAGE =
        'Course unit/topic models are not initialized in Prisma Client. Run `npm --prefix server run prisma:generate` and restart the server.';
    private static hierarchySchemaReady = false;
    private static hierarchySchemaBootstrap: Promise<void> | null = null;

    private static isHierarchyClientReady(): boolean {
        const client = prisma as unknown as Record<string, any>;
        return Boolean(
            client?.courseUnit &&
                typeof client.courseUnit.findFirst === 'function' &&
                client?.courseTopic &&
                typeof client.courseTopic.findFirst === 'function'
        );
    }

    private static assertHierarchyClientReady() {
        if (!this.isHierarchyClientReady()) {
            throw new ApiError(503, this.HIERARCHY_CLIENT_MESSAGE);
        }
    }

    private static async ensureHierarchySchemaObjects() {
        if (!this.isHierarchyClientReady()) {
            return;
        }

        if (this.hierarchySchemaReady) {
            return;
        }

        if (this.hierarchySchemaBootstrap) {
            await this.hierarchySchemaBootstrap;
            return;
        }

        this.hierarchySchemaBootstrap = (async () => {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "CourseUnit" (
                    "id" TEXT NOT NULL,
                    "courseId" TEXT NOT NULL,
                    "title" TEXT NOT NULL,
                    "sortOrder" INTEGER NOT NULL DEFAULT 0,
                    "estimatedHours" INTEGER,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "CourseUnit_pkey" PRIMARY KEY ("id")
                );
            `);

            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "CourseTopic" (
                    "id" TEXT NOT NULL,
                    "unitId" TEXT NOT NULL,
                    "lessonId" TEXT,
                    "title" TEXT NOT NULL,
                    "sortOrder" INTEGER NOT NULL DEFAULT 0,
                    "estimatedMinutes" INTEGER,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "CourseTopic_pkey" PRIMARY KEY ("id")
                );
            `);

            await prisma.$executeRawUnsafe(`
                ALTER TABLE "Lesson"
                ADD COLUMN IF NOT EXISTS "unitId" TEXT;
            `);

            await prisma.$executeRawUnsafe(`
                CREATE UNIQUE INDEX IF NOT EXISTS "CourseTopic_lessonId_key" ON "CourseTopic"("lessonId");
            `);
            await prisma.$executeRawUnsafe(`
                CREATE INDEX IF NOT EXISTS "CourseUnit_courseId_sortOrder_idx" ON "CourseUnit"("courseId", "sortOrder");
            `);
            await prisma.$executeRawUnsafe(`
                CREATE INDEX IF NOT EXISTS "CourseTopic_unitId_sortOrder_idx" ON "CourseTopic"("unitId", "sortOrder");
            `);
            await prisma.$executeRawUnsafe(`
                CREATE INDEX IF NOT EXISTS "Lesson_courseId_unitId_createdAt_idx" ON "Lesson"("courseId", "unitId", "createdAt");
            `);

            await prisma.$executeRawUnsafe(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CourseUnit_courseId_fkey') THEN
                        ALTER TABLE "CourseUnit"
                        ADD CONSTRAINT "CourseUnit_courseId_fkey"
                        FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                    END IF;
                END
                $$;
            `);

            await prisma.$executeRawUnsafe(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CourseTopic_unitId_fkey') THEN
                        ALTER TABLE "CourseTopic"
                        ADD CONSTRAINT "CourseTopic_unitId_fkey"
                        FOREIGN KEY ("unitId") REFERENCES "CourseUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                    END IF;
                END
                $$;
            `);

            await prisma.$executeRawUnsafe(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CourseTopic_lessonId_fkey') THEN
                        ALTER TABLE "CourseTopic"
                        ADD CONSTRAINT "CourseTopic_lessonId_fkey"
                        FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
                    END IF;
                END
                $$;
            `);

            await prisma.$executeRawUnsafe(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Lesson_unitId_fkey') THEN
                        ALTER TABLE "Lesson"
                        ADD CONSTRAINT "Lesson_unitId_fkey"
                        FOREIGN KEY ("unitId") REFERENCES "CourseUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
                    END IF;
                END
                $$;
            `);

            this.hierarchySchemaReady = true;
        })();

        try {
            await this.hierarchySchemaBootstrap;
        } finally {
            this.hierarchySchemaBootstrap = null;
        }
    }

    private static isHierarchySchemaError(error: unknown): boolean {
        const message = String((error as { message?: string })?.message || '').toLowerCase();
        const mentionsHierarchyObjects =
            message.includes('courseunit') ||
            message.includes('coursetopic') ||
            message.includes('unitid') ||
            message.includes("reading 'findfirst'") ||
            message.includes('is not a function');

        if (mentionsHierarchyObjects) {
            return true;
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2021: table missing, P2022: column missing, P2010: raw query error
            return error.code === 'P2021' || error.code === 'P2022' || error.code === 'P2010';
        }

        return false;
    }

    private static toHierarchyApiError(error: unknown): never {
        if (this.isHierarchySchemaError(error)) {
            throw new ApiError(503, this.HIERARCHY_MIGRATION_MESSAGE);
        }
        throw error;
    }

    private static safeDeleteFile(fileUrl: string) {
        try {
            const filePath = path.resolve(process.cwd(), fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error(`Failed to delete course material file: ${fileUrl}`, error);
        }
    }

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

    private static async ensureUnitTopicHierarchy(courseId: string) {
        if (!this.isHierarchyClientReady()) {
            return;
        }

        try {
            const lessons = await prisma.lesson.findMany({
                where: { courseId },
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    title: true,
                    unitId: true,
                    createdAt: true,
                },
            });

            if (lessons.length === 0) {
                return;
            }

            await prisma.$transaction(async (tx) => {
                let primaryUnit = await tx.courseUnit.findFirst({
                    where: { courseId },
                    orderBy: { sortOrder: 'asc' },
                    select: { id: true },
                });

                if (!primaryUnit) {
                    primaryUnit = await tx.courseUnit.create({
                        data: {
                            courseId,
                            title: 'Unit 1',
                            sortOrder: 1,
                            estimatedHours: Math.max(8, lessons.length * 2),
                        },
                        select: { id: true },
                    });
                }

                await tx.lesson.updateMany({
                    where: {
                        courseId,
                        unitId: null,
                    },
                    data: {
                        unitId: primaryUnit.id,
                    },
                });

                const normalizedLessons = await tx.lesson.findMany({
                    where: { courseId },
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        unitId: true,
                    },
                });

                const unitIds = Array.from(
                    new Set(
                        normalizedLessons
                            .map((lesson) => lesson.unitId)
                            .filter((unitId): unitId is string => Boolean(unitId))
                    )
                );

                if (unitIds.length === 0) {
                    return;
                }

                const existingTopics = await tx.courseTopic.findMany({
                    where: {
                        unitId: { in: unitIds },
                    },
                    select: {
                        unitId: true,
                        lessonId: true,
                        sortOrder: true,
                    },
                });

                const lessonIdsWithTopic = new Set(
                    existingTopics
                        .map((topic) => topic.lessonId)
                        .filter((lessonId): lessonId is string => Boolean(lessonId))
                );
                const maxSortByUnit = new Map<string, number>();
                for (const topic of existingTopics) {
                    const current = maxSortByUnit.get(topic.unitId) || 0;
                    if (topic.sortOrder > current) {
                        maxSortByUnit.set(topic.unitId, topic.sortOrder);
                    }
                }

                const topicsToCreate: Array<{
                    unitId: string;
                    lessonId: string;
                    title: string;
                    sortOrder: number;
                    estimatedMinutes: number;
                }> = [];

                for (const lesson of normalizedLessons) {
                    if (!lesson.unitId || lessonIdsWithTopic.has(lesson.id)) {
                        continue;
                    }

                    const nextSort = (maxSortByUnit.get(lesson.unitId) || 0) + 1;
                    maxSortByUnit.set(lesson.unitId, nextSort);

                    topicsToCreate.push({
                        unitId: lesson.unitId,
                        lessonId: lesson.id,
                        title: lesson.title,
                        sortOrder: nextSort,
                        estimatedMinutes: 30,
                    });
                }

                if (topicsToCreate.length > 0) {
                    await tx.courseTopic.createMany({
                        data: topicsToCreate,
                    });
                }
            });
        } catch (error) {
            if (this.isHierarchySchemaError(error)) {
                return;
            }
            throw error;
        }
    }

    static async findById(id: string): Promise<Course | null> {
        if (this.isHierarchyClientReady()) {
            try {
                await this.ensureHierarchySchemaObjects();
            } catch {
                // Reads should still work in legacy mode if schema bootstrap is unavailable.
            }
        }

        await this.ensureUnitTopicHierarchy(id);

        try {
            return await prisma.course.findUnique({
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
                            content: true,
                            unitId: true,
                            createdAt: true,
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                    units: {
                        orderBy: { sortOrder: 'asc' },
                        include: {
                            topics: {
                                orderBy: { sortOrder: 'asc' },
                                include: {
                                    lesson: {
                                        select: {
                                            id: true,
                                            title: true,
                                            content: true,
                                            createdAt: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {
            if (!this.isHierarchySchemaError(error)) {
                throw error;
            }

            const legacyCourse = await prisma.course.findUnique({
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
                            content: true,
                            createdAt: true,
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });

            if (!legacyCourse) {
                return null;
            }

            return {
                ...legacyCourse,
                lessons: legacyCourse.lessons.map((lesson) => ({
                    ...lesson,
                    unitId: null,
                })),
                units: [],
            } as Course;
        }
    }

    static async getUnitsByCourse(courseId: string) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true },
        });

        if (!course) {
            throw new ApiError(404, 'Course not found');
        }

        if (!this.isHierarchyClientReady()) {
            return [];
        }

        try {
            await this.ensureHierarchySchemaObjects();
        } catch {
            return [];
        }

        await this.ensureUnitTopicHierarchy(courseId);

        try {
            return await prisma.courseUnit.findMany({
                where: { courseId },
                orderBy: { sortOrder: 'asc' },
                include: {
                    topics: {
                        orderBy: { sortOrder: 'asc' },
                        include: {
                            lesson: {
                                select: {
                                    id: true,
                                    title: true,
                                    content: true,
                                    createdAt: true,
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {
            if (this.isHierarchySchemaError(error)) {
                return [];
            }
            throw error;
        }
    }

    static async createUnit(
        courseId: string,
        requesterId: string,
        requesterRole: string,
        data: { title: string; sortOrder?: number; estimatedHours?: number }
    ) {
        this.assertHierarchyClientReady();
        await this.ensureHierarchySchemaObjects();

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, teacherId: true },
        });

        if (!course) {
            throw new ApiError(404, 'Course not found');
        }

        if (requesterRole !== 'ADMIN' && course.teacherId !== requesterId) {
            throw new ApiError(403, 'Forbidden: You do not have permission to add units to this course');
        }

        try {
            const existingUnit = await prisma.courseUnit.findFirst({
                where: {
                    courseId,
                    title: data.title.trim(),
                },
                select: { id: true },
            });

            if (existingUnit) {
                throw new ApiError(409, 'A unit with this title already exists');
            }

            const nextSortOrder = (() => {
                if (data.sortOrder && data.sortOrder > 0) {
                    return data.sortOrder;
                }
                return undefined;
            })();

            if (nextSortOrder) {
                return prisma.courseUnit.create({
                    data: {
                        courseId,
                        title: data.title.trim(),
                        sortOrder: nextSortOrder,
                        estimatedHours: data.estimatedHours,
                    },
                });
            }

            const lastUnit = await prisma.courseUnit.findFirst({
                where: { courseId },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true },
            });

            return prisma.courseUnit.create({
                data: {
                    courseId,
                    title: data.title.trim(),
                    sortOrder: (lastUnit?.sortOrder || 0) + 1,
                    estimatedHours: data.estimatedHours,
                },
            });
        } catch (error) {
            this.toHierarchyApiError(error);
        }
    }

    static async createTopic(
        courseId: string,
        unitId: string,
        requesterId: string,
        requesterRole: string,
        data: { title: string; lessonId?: string; sortOrder?: number; estimatedMinutes?: number }
    ) {
        this.assertHierarchyClientReady();
        await this.ensureHierarchySchemaObjects();

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, teacherId: true },
        });

        if (!course) {
            throw new ApiError(404, 'Course not found');
        }

        if (requesterRole !== 'ADMIN' && course.teacherId !== requesterId) {
            throw new ApiError(403, 'Forbidden: You do not have permission to add topics to this course');
        }

        try {
            const unit = await prisma.courseUnit.findUnique({
                where: { id: unitId },
                select: { id: true, courseId: true },
            });

            if (!unit || unit.courseId !== courseId) {
                throw new ApiError(404, 'Unit not found for this course');
            }

            if (data.lessonId) {
                const lesson = await prisma.lesson.findUnique({
                    where: { id: data.lessonId },
                    select: { id: true, courseId: true },
                });

                if (!lesson || lesson.courseId !== courseId) {
                    throw new ApiError(400, 'Lesson does not belong to this course');
                }
            }

            const existingTopic = await prisma.courseTopic.findFirst({
                where: {
                    unitId,
                    title: data.title.trim(),
                },
                select: { id: true },
            });

            if (existingTopic) {
                throw new ApiError(409, 'A topic with this title already exists in this unit');
            }

            const resolvedSortOrder = (() => {
                if (data.sortOrder && data.sortOrder > 0) {
                    return data.sortOrder;
                }
                return undefined;
            })();

            if (resolvedSortOrder) {
                return prisma.courseTopic.create({
                    data: {
                        unitId,
                        title: data.title.trim(),
                        lessonId: data.lessonId,
                        sortOrder: resolvedSortOrder,
                        estimatedMinutes: data.estimatedMinutes || 30,
                    },
                });
            }

            const lastTopic = await prisma.courseTopic.findFirst({
                where: { unitId },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true },
            });

            return prisma.courseTopic.create({
                data: {
                    unitId,
                    title: data.title.trim(),
                    lessonId: data.lessonId,
                    sortOrder: (lastTopic?.sortOrder || 0) + 1,
                    estimatedMinutes: data.estimatedMinutes || 30,
                },
            });
        } catch (error) {
            this.toHierarchyApiError(error);
        }
    }

    static async reorderUnits(
        courseId: string,
        requesterId: string,
        requesterRole: string,
        unitIds: string[]
    ) {
        this.assertHierarchyClientReady();
        await this.ensureHierarchySchemaObjects();

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, teacherId: true },
        });

        if (!course) {
            throw new ApiError(404, 'Course not found');
        }

        if (requesterRole !== 'ADMIN' && course.teacherId !== requesterId) {
            throw new ApiError(403, 'Forbidden: You do not have permission to reorder units in this course');
        }

        try {
            const existingUnits = await prisma.courseUnit.findMany({
                where: { courseId },
                select: { id: true },
            });
            const existingIds = existingUnits.map((unit) => unit.id);

            if (existingIds.length !== unitIds.length) {
                throw new ApiError(400, 'Unit reorder payload must include all units exactly once');
            }

            const payloadSet = new Set(unitIds);
            if (payloadSet.size !== unitIds.length || !existingIds.every((id) => payloadSet.has(id))) {
                throw new ApiError(400, 'Invalid unit reorder payload');
            }

            await prisma.$transaction(
                unitIds.map((id, index) =>
                    prisma.courseUnit.update({
                        where: { id },
                        data: { sortOrder: index + 1 },
                    })
                )
            );
        } catch (error) {
            this.toHierarchyApiError(error);
        }
    }

    static async reorderTopics(
        courseId: string,
        unitId: string,
        requesterId: string,
        requesterRole: string,
        topicIds: string[]
    ) {
        this.assertHierarchyClientReady();
        await this.ensureHierarchySchemaObjects();

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, teacherId: true },
        });

        if (!course) {
            throw new ApiError(404, 'Course not found');
        }

        if (requesterRole !== 'ADMIN' && course.teacherId !== requesterId) {
            throw new ApiError(403, 'Forbidden: You do not have permission to reorder topics in this course');
        }

        try {
            const unit = await prisma.courseUnit.findUnique({
                where: { id: unitId },
                select: { id: true, courseId: true },
            });

            if (!unit || unit.courseId !== courseId) {
                throw new ApiError(404, 'Unit not found for this course');
            }

            const existingTopics = await prisma.courseTopic.findMany({
                where: { unitId },
                select: { id: true },
            });
            const existingIds = existingTopics.map((topic) => topic.id);

            if (existingIds.length !== topicIds.length) {
                throw new ApiError(400, 'Topic reorder payload must include all unit topics exactly once');
            }

            const payloadSet = new Set(topicIds);
            if (payloadSet.size !== topicIds.length || !existingIds.every((id) => payloadSet.has(id))) {
                throw new ApiError(400, 'Invalid topic reorder payload');
            }

            await prisma.$transaction(
                topicIds.map((id, index) =>
                    prisma.courseTopic.update({
                        where: { id },
                        data: { sortOrder: index + 1 },
                    })
                )
            );
        } catch (error) {
            this.toHierarchyApiError(error);
        }
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

        const enrollment = await prisma.enrollment.create({
            data: { userId, courseId },
        });

        try {
            await AchievementService.onStudentEnrolled(userId);
        } catch (error) {
            console.error('Failed to evaluate enrollment achievements:', error);
        }

        return enrollment;
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

    static async deleteById(courseId: string, requesterId: string, requesterRole: string): Promise<void> {
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
            throw new ApiError(403, 'Forbidden: You do not have permission to delete this course');
        }

        const materials = await prisma.courseMaterial.findMany({
            where: { courseId },
            select: {
                id: true,
                fileUrl: true,
            },
        });

        const lessons = await prisma.lesson.findMany({
            where: { courseId },
            select: { id: true },
        });
        const lessonIds = lessons.map((lesson) => lesson.id);

        const problems = lessonIds.length > 0
            ? await prisma.problem.findMany({
                  where: {
                      lessonId: {
                          in: lessonIds,
                      },
                  },
                  select: { id: true },
              })
            : [];
        const problemIds = problems.map((problem) => problem.id);

        const quizzes = await prisma.quiz.findMany({
            where: { courseId },
            select: { id: true },
        });
        const quizIds = quizzes.map((quiz) => quiz.id);

        await prisma.$transaction(async (tx) => {
            if (quizIds.length > 0) {
                await tx.quizAttempt.deleteMany({
                    where: { quizId: { in: quizIds } },
                });
                await tx.quizQuestion.deleteMany({
                    where: { quizId: { in: quizIds } },
                });
                await tx.quiz.deleteMany({
                    where: { id: { in: quizIds } },
                });
            }

            if (problemIds.length > 0) {
                await tx.submission.deleteMany({
                    where: { problemId: { in: problemIds } },
                });
                await tx.problem.deleteMany({
                    where: { id: { in: problemIds } },
                });
            }

            if (lessonIds.length > 0) {
                await tx.lesson.deleteMany({
                    where: { id: { in: lessonIds } },
                });
            }

            await tx.enrollment.deleteMany({
                where: { courseId },
            });

            await tx.courseMaterial.deleteMany({
                where: { courseId },
            });

            await tx.course.delete({
                where: { id: courseId },
            });
        });

        for (const material of materials) {
            this.safeDeleteFile(material.fileUrl);
        }
    }
}
