import { Prisma } from '@prisma/client';
import prisma from '../db/prisma';
import { emitToUser } from '../utils/socket';

type BadgeCode =
    | 'FIRST_ENROLLMENT'
    | 'FIRST_SOLVE'
    | 'TEN_SOLVES'
    | 'TWENTY_FIVE_SOLVES'
    | 'FIRST_QUIZ_COMPLETION'
    | 'QUIZ_STREAK_3'
    | 'QUIZ_ACE'
    | 'FIRST_BATTLE_JOIN'
    | 'BATTLE_CHAMPION';

type MetricKey =
    | 'courseEnrollments'
    | 'solvedProblems'
    | 'completedQuizzes'
    | 'highScoreQuizzes'
    | 'battleJoins'
    | 'battleWins';

interface BadgeSeed {
    code: BadgeCode;
    title: string;
    description: string;
    icon: string;
    category: 'LEARNING' | 'PROBLEM_SOLVING' | 'QUIZ' | 'BATTLE';
    metric?: MetricKey;
    target?: number;
}

interface UserAchievementMetrics {
    courseEnrollments: number;
    solvedProblems: number;
    completedQuizzes: number;
    highScoreQuizzes: number;
    battleJoins: number;
    battleWins: number;
}

const BADGE_DEFINITIONS: BadgeSeed[] = [
    {
        code: 'FIRST_ENROLLMENT',
        title: 'First Step',
        description: 'Enroll in your first course.',
        icon: 'book-open',
        category: 'LEARNING',
        metric: 'courseEnrollments',
        target: 1,
    },
    {
        code: 'FIRST_SOLVE',
        title: 'First Accepted',
        description: 'Get your first coding problem accepted.',
        icon: 'check-circle-2',
        category: 'PROBLEM_SOLVING',
        metric: 'solvedProblems',
        target: 1,
    },
    {
        code: 'TEN_SOLVES',
        title: 'Problem Solver',
        description: 'Solve 10 unique coding problems.',
        icon: 'code-2',
        category: 'PROBLEM_SOLVING',
        metric: 'solvedProblems',
        target: 10,
    },
    {
        code: 'TWENTY_FIVE_SOLVES',
        title: 'Algorithm Grinder',
        description: 'Solve 25 unique coding problems.',
        icon: 'flame',
        category: 'PROBLEM_SOLVING',
        metric: 'solvedProblems',
        target: 25,
    },
    {
        code: 'FIRST_QUIZ_COMPLETION',
        title: 'Quiz Starter',
        description: 'Complete your first quiz attempt.',
        icon: 'clipboard-check',
        category: 'QUIZ',
        metric: 'completedQuizzes',
        target: 1,
    },
    {
        code: 'QUIZ_STREAK_3',
        title: 'Consistent Scholar',
        description: 'Score 80%+ in three quizzes.',
        icon: 'sparkles',
        category: 'QUIZ',
        metric: 'highScoreQuizzes',
        target: 3,
    },
    {
        code: 'QUIZ_ACE',
        title: 'Quiz Ace',
        description: 'Score 90%+ in a quiz.',
        icon: 'graduation-cap',
        category: 'QUIZ',
    },
    {
        code: 'FIRST_BATTLE_JOIN',
        title: 'Battle Ready',
        description: 'Join your first battle room.',
        icon: 'swords',
        category: 'BATTLE',
        metric: 'battleJoins',
        target: 1,
    },
    {
        code: 'BATTLE_CHAMPION',
        title: 'Battle Champion',
        description: 'Finish rank #1 in a live battle.',
        icon: 'trophy',
        category: 'BATTLE',
        metric: 'battleWins',
        target: 1,
    },
];

interface AwardResult {
    awarded: boolean;
    code: BadgeCode;
}

export class AchievementService {
    private static seedPromise: Promise<void> | null = null;

    private static async ensureDefinitionsSeeded() {
        if (this.seedPromise) {
            return this.seedPromise;
        }

        this.seedPromise = (async () => {
            await Promise.all(
                BADGE_DEFINITIONS.map((badge) =>
                    prisma.badgeDefinition.upsert({
                        where: { code: badge.code },
                        update: {
                            title: badge.title,
                            description: badge.description,
                            icon: badge.icon,
                            category: badge.category,
                        },
                        create: {
                            code: badge.code,
                            title: badge.title,
                            description: badge.description,
                            icon: badge.icon,
                            category: badge.category,
                        },
                    })
                )
            );
        })().catch((error) => {
            this.seedPromise = null;
            throw error;
        });

        return this.seedPromise;
    }

    private static async grantBadge(
        userId: string,
        code: BadgeCode,
        metadata?: Prisma.InputJsonValue
    ): Promise<AwardResult> {
        await this.ensureDefinitionsSeeded();

        const definition = await prisma.badgeDefinition.findUnique({
            where: { code },
            select: {
                id: true,
                code: true,
                title: true,
                description: true,
                icon: true,
                category: true,
            },
        });

        if (!definition) {
            return { awarded: false, code };
        }

        try {
            const userBadge = await prisma.userBadge.create({
                data: {
                    userId,
                    badgeId: definition.id,
                    metadata,
                },
                select: {
                    earnedAt: true,
                },
            });

            await prisma.activityLog.create({
                data: {
                    userId,
                    action: `Unlocked badge "${definition.title}"`,
                    metadata: {
                        badgeCode: definition.code,
                        category: definition.category,
                    },
                },
            });

            emitToUser(userId, 'BADGE_UNLOCKED', {
                code: definition.code,
                title: definition.title,
                description: definition.description,
                icon: definition.icon,
                category: definition.category,
                earnedAt: userBadge.earnedAt.toISOString(),
            });

            return { awarded: true, code };
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                return { awarded: false, code };
            }
            throw error;
        }
    }

    private static async getMetrics(userId: string): Promise<UserAchievementMetrics> {
        const [enrollmentCount, solvedProblems, completedQuizzes, highScoreQuizzes, battleJoins, battleWins] =
            await Promise.all([
                prisma.enrollment.count({
                    where: { userId },
                }),
                prisma.submission.findMany({
                    where: {
                        studentId: userId,
                        status: 'ACCEPTED',
                    },
                    select: { problemId: true },
                    distinct: ['problemId'],
                }),
                prisma.quizAttempt.count({
                    where: {
                        userId,
                        submittedAt: { not: null },
                    },
                }),
                prisma.quizAttempt.count({
                    where: {
                        userId,
                        submittedAt: { not: null },
                        score: { gte: 80 },
                    },
                }),
                prisma.battleParticipant.findMany({
                    where: { userId },
                    select: { roomId: true },
                    distinct: ['roomId'],
                }),
                prisma.userBadge.count({
                    where: {
                        userId,
                        badge: { code: 'BATTLE_CHAMPION' },
                    },
                }),
            ]);

        return {
            courseEnrollments: enrollmentCount,
            solvedProblems: solvedProblems.length,
            completedQuizzes,
            highScoreQuizzes,
            battleJoins: battleJoins.length,
            battleWins,
        };
    }

    private static async evaluateThresholdBadges(userId: string) {
        const metrics = await this.getMetrics(userId);
        const awards: AwardResult[] = [];

        if (metrics.courseEnrollments >= 1) {
            awards.push(await this.grantBadge(userId, 'FIRST_ENROLLMENT', { count: metrics.courseEnrollments }));
        }

        if (metrics.solvedProblems >= 1) {
            awards.push(await this.grantBadge(userId, 'FIRST_SOLVE', { solvedProblems: metrics.solvedProblems }));
        }
        if (metrics.solvedProblems >= 10) {
            awards.push(await this.grantBadge(userId, 'TEN_SOLVES', { solvedProblems: metrics.solvedProblems }));
        }
        if (metrics.solvedProblems >= 25) {
            awards.push(
                await this.grantBadge(userId, 'TWENTY_FIVE_SOLVES', { solvedProblems: metrics.solvedProblems })
            );
        }

        if (metrics.completedQuizzes >= 1) {
            awards.push(
                await this.grantBadge(userId, 'FIRST_QUIZ_COMPLETION', {
                    completedQuizzes: metrics.completedQuizzes,
                })
            );
        }
        if (metrics.highScoreQuizzes >= 3) {
            awards.push(await this.grantBadge(userId, 'QUIZ_STREAK_3', { highScoreQuizzes: metrics.highScoreQuizzes }));
        }

        if (metrics.battleJoins >= 1) {
            awards.push(await this.grantBadge(userId, 'FIRST_BATTLE_JOIN', { battleJoins: metrics.battleJoins }));
        }

        return awards;
    }

    static async onStudentEnrolled(userId: string) {
        await this.evaluateThresholdBadges(userId);
    }

    static async onProblemSubmissionEvaluated(input: {
        userId: string;
        finalVerdict: string;
    }) {
        if (input.finalVerdict === 'ACCEPTED') {
            await this.evaluateThresholdBadges(input.userId);
        }
    }

    static async onQuizAttemptSubmitted(input: { userId: string; score: number }) {
        await this.evaluateThresholdBadges(input.userId);

        if (Number.isFinite(input.score) && input.score >= 90) {
            await this.grantBadge(input.userId, 'QUIZ_ACE', { score: input.score });
        }
    }

    static async onBattleJoined(userId: string) {
        await this.evaluateThresholdBadges(userId);
    }

    static async onBattleEnded(input: {
        roomId: string;
        leaderboard: Array<{ rank: number; userId: string; isCorrect: boolean }>;
    }) {
        const winner = input.leaderboard.find((entry) => entry.rank === 1 && entry.isCorrect);
        if (!winner) {
            return;
        }

        await this.grantBadge(winner.userId, 'BATTLE_CHAMPION', { roomId: input.roomId });
        await this.evaluateThresholdBadges(winner.userId);
    }

    static async getUserAchievements(userId: string) {
        await this.ensureDefinitionsSeeded();

        const [metrics, definitions, earnedRows] = await Promise.all([
            this.getMetrics(userId),
            prisma.badgeDefinition.findMany({
                orderBy: [
                    { category: 'asc' },
                    { createdAt: 'asc' },
                ],
            }),
            prisma.userBadge.findMany({
                where: { userId },
                include: {
                    badge: true,
                },
                orderBy: { earnedAt: 'desc' },
            }),
        ]);

        const earnedByCode = new Map(
            earnedRows.map((row) => [
                row.badge.code,
                {
                    earnedAt: row.earnedAt,
                    metadata: row.metadata,
                },
            ])
        );

        const badges = definitions.map((definition) => {
            const earned = earnedByCode.get(definition.code);
            const seed = BADGE_DEFINITIONS.find((item) => item.code === definition.code);
            const target = seed?.target ?? null;
            const progressCurrent = seed?.metric ? metrics[seed.metric] : earned ? 1 : 0;
            const normalizedCurrent =
                typeof target === 'number'
                    ? Math.min(progressCurrent, target)
                    : progressCurrent;

            return {
                code: definition.code,
                title: definition.title,
                description: definition.description,
                icon: definition.icon,
                category: definition.category,
                earned: Boolean(earned),
                earnedAt: earned ? earned.earnedAt.toISOString() : null,
                progressCurrent: normalizedCurrent,
                progressTarget: target,
                metadata: earned?.metadata ?? null,
            };
        });

        const earnedCount = badges.filter((badge) => badge.earned).length;
        const totalCount = badges.length;

        return {
            totals: {
                earned: earnedCount,
                total: totalCount,
                completionPercent: totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0,
            },
            highlights: metrics,
            recentUnlocked: badges.filter((badge) => badge.earned).slice(0, 6),
            badges,
        };
    }
}
