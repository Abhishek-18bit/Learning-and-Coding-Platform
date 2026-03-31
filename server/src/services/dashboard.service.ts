import prisma from '../db/prisma';

export class DashboardService {
    private static formatDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private static calculateCurrentSolveStreak(solvedDateKeys: string[]): number {
        if (solvedDateKeys.length === 0) {
            return 0;
        }

        const solvedDays = new Set(
            solvedDateKeys
                .map((value) => value?.trim())
                .filter((value): value is string => Boolean(value))
        );

        const cursor = new Date();
        cursor.setHours(0, 0, 0, 0);

        let streak = 0;
        while (solvedDays.has(this.formatDateKey(cursor))) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return streak;
    }

    static async getStudentData(userId: string) {
        const activityWindowStart = new Date();
        activityWindowStart.setDate(activityWindowStart.getDate() - 89);

        const [
            enrollmentCount,
            solvedProblemsCount,
            quizAttempts,
            activityLogs,
            recentSubmissions,
            recentQuizAttempts,
            recentInterviewProgress,
            recentEnrollments,
            allEnrollments,
            solvedDayRows
        ] = await Promise.all([
            prisma.enrollment.count({ where: { userId } }),
            prisma.submission.count({ where: { studentId: userId, status: 'ACCEPTED' } }),
            prisma.quizAttempt.findMany({
                where: { userId, submittedAt: { not: null } },
                select: { score: true }
            }),
            prisma.activityLog.findMany({
                where: {
                    userId,
                    createdAt: { gte: activityWindowStart },
                },
                select: {
                    id: true,
                    action: true,
                    createdAt: true,
                },
                take: 120,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.submission.findMany({
                where: {
                    studentId: userId,
                    createdAt: { gte: activityWindowStart },
                },
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    problem: {
                        select: { title: true },
                    },
                },
                take: 120,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.quizAttempt.findMany({
                where: {
                    userId,
                    submittedAt: { gte: activityWindowStart },
                },
                select: {
                    id: true,
                    score: true,
                    submittedAt: true,
                    quiz: {
                        select: { title: true },
                    },
                },
                take: 120,
                orderBy: { submittedAt: 'desc' },
            }),
            prisma.interviewProgress.findMany({
                where: {
                    userId,
                    completed: true,
                    completedAt: { gte: activityWindowStart },
                },
                select: {
                    id: true,
                    completedAt: true,
                    question: {
                        select: { title: true },
                    },
                },
                take: 120,
                orderBy: { completedAt: 'desc' },
            }),
            prisma.enrollment.findMany({
                where: { userId },
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                        }
                    }
                },
                take: 3,
                orderBy: { enrolledAt: 'desc' }
            }),
            prisma.enrollment.findMany({
                where: { userId },
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                        }
                    }
                },
                orderBy: { enrolledAt: 'desc' }
            }),
            prisma.$queryRaw<Array<{ solvedDate: string }>>`
                SELECT DISTINCT TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') AS "solvedDate"
                FROM "Submission"
                WHERE "studentId" = ${userId}
                  AND "status" = 'ACCEPTED'
                ORDER BY "solvedDate" DESC
            `
        ]);

        const [questionsCount, completedQuestionsCount] = await Promise.all([
            prisma.interviewQuestion.count(),
            prisma.interviewProgress.count({ where: { userId, completed: true } })
        ]);

        const interviewProgress = questionsCount > 0
            ? Math.round((completedQuestionsCount / questionsCount) * 100)
            : 0;

        const quizAverage = quizAttempts.length > 0
            ? Math.round(quizAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / quizAttempts.length)
            : 0;
        const streakDays = this.calculateCurrentSolveStreak(solvedDayRows.map((row) => row.solvedDate));

        const derivedActivity = [
            ...activityLogs.map((log) => ({
                id: `log:${log.id}`,
                text: log.action,
                createdAt: log.createdAt,
            })),
            ...recentSubmissions.map((submission) => {
                const normalizedStatus = submission.status.split('_').join(' ').toLowerCase();
                const verb = submission.status === 'ACCEPTED' ? 'Solved' : 'Attempted';
                const problemTitle = submission.problem?.title || 'Untitled problem';
                return {
                    id: `submission:${submission.id}`,
                    text: `${verb} problem "${problemTitle}" (${normalizedStatus})`,
                    createdAt: submission.createdAt,
                };
            }),
            ...recentQuizAttempts.map((attempt) => ({
                id: `quiz:${attempt.id}`,
                text: `Completed quiz "${attempt.quiz?.title || 'Untitled quiz'}" with ${attempt.score ?? 0}% score`,
                createdAt: attempt.submittedAt || new Date(),
            })),
            ...recentInterviewProgress.map((progress) => ({
                id: `interview:${progress.id}`,
                text: `Completed interview topic "${progress.question?.title || 'Interview question'}"`,
                createdAt: progress.completedAt || new Date(),
            })),
        ]
            .filter((entry) => entry.createdAt >= activityWindowStart)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 240);

        const continueLearning = await Promise.all(recentEnrollments.map(async (enr) => {
            const courseId = enr.course.id;
            const lessons = await prisma.lesson.findMany({
                where: { courseId },
                include: { problems: { select: { id: true } } }
            });

            const allProblemIds = lessons.flatMap(l => l.problems.map(p => p.id));
            const totalProblems = allProblemIds.length;

            const solvedCount = totalProblems > 0
                ? await prisma.submission.count({
                    where: {
                        studentId: userId,
                        problemId: { in: allProblemIds },
                        status: 'ACCEPTED'
                    }
                })
                : 0;

            return {
                id: enr.course.id,
                title: enr.course.title,
                progress: totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0,
                nextLesson: lessons[0]?.title || "Coming Soon"
            };
        }));

        return {
            coursesEnrolled: enrollmentCount,
            problemsSolved: solvedProblemsCount,
            streakDays,
            quizAverage,
            interviewProgress,
            recentActivity: derivedActivity.map((entry) => ({
                id: entry.id,
                text: entry.text,
                createdAt: entry.createdAt.toISOString(),
            })),
            enrolledCourses: allEnrollments.map((enrollment) => ({
                id: enrollment.course.id,
                title: enrollment.course.title
            })),
            continueLearning
        };
    }

    static async getTeacherData(teacherId: string) {
        const [
            courses,
            totalStudents,
            totalSubmissions,
            recentSubmissions
        ] = await Promise.all([
            prisma.course.findMany({
                where: { teacherId },
                include: {
                    _count: {
                        select: {
                            enrollments: true,
                            lessons: true,
                        }
                    }
                }
            }),
            prisma.enrollment.count({
                where: {
                    course: { teacherId }
                }
            }),
            prisma.submission.count({
                where: {
                    problem: {
                        lesson: {
                            course: { teacherId }
                        }
                    }
                }
            }),
            prisma.submission.findMany({
                where: {
                    problem: {
                        lesson: {
                            course: { teacherId }
                        }
                    }
                },
                include: {
                    student: {
                        select: { name: true }
                    },
                    problem: {
                        select: { title: true }
                    }
                },
                take: 5,
                orderBy: { createdAt: 'desc' }
            })
        ]);

        return {
            totalCourses: courses.length,
            totalStudents,
            totalSubmissions,
            activeStudents: Math.floor(totalStudents * 0.8), // Placeholder heuristic
            courses: courses.map(c => ({
                id: c.id,
                title: c.title,
                studentCount: c._count.enrollments,
                lessonCount: c._count.lessons
            })),
            recentSubmissions: recentSubmissions.map(s => ({
                id: s.id,
                studentName: s.student.name,
                problemTitle: s.problem.title,
                status: s.status,
                createdAt: s.createdAt
            }))
        };
    }

    static async getPlatformStats() {
        const [
            totalCourses,
            totalProblems,
            totalQuizzes,
            totalBattleRooms,
            totalStudents,
            totalTeachers,
            aiGeneratedQuizzes,
            totalSubmissions
        ] = await Promise.all([
            prisma.course.count(),
            prisma.problem.count(),
            prisma.quiz.count(),
            prisma.battleRoom.count(),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: { in: ['TEACHER', 'ADMIN'] } } }),
            prisma.quiz.count({
                where: {
                    sourceType: {
                        in: ['LESSON_AI', 'PDF_AI']
                    }
                }
            }),
            prisma.submission.count()
        ]);

        return {
            totalCourses,
            totalProblems,
            totalQuizzes,
            totalBattleRooms,
            totalStudents,
            totalTeachers,
            aiGeneratedQuizzes,
            totalSubmissions
        };
    }
}
