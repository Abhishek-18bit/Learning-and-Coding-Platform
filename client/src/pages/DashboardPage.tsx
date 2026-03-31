import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Code, Loader2, Radar, Rocket, Sparkles, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardService } from '../services/dashboard.service';
import { achievementService } from '../services/achievement.service';
import { fadeIn, staggerContainer } from '../animations/variants';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import ActivityChart from '../components/dashboard/ActivityChart';
import RecentProblems from '../components/dashboard/RecentProblems';
import StatSection, { type StatSectionItem } from '../components/dashboard/StatSection';
import { useSocket } from '../providers/SocketProvider';
import { resolveAchievementIcon } from '../utils/achievementIcons';

interface CourseProgressCard {
    courseId: string;
    courseTitle: string;
    solvedProblems: number;
    attemptedProblems: number;
    totalProblems: number;
    completionPercent: number;
}

interface CourseVisualConfig {
    badgeVariant: CourseBadgeVariant;
    titleClass: string;
    barClass: string;
}

const toPercent = (value: number) => Math.max(0, Math.min(100, value));

type CourseBadgeVariant = 'dsa' | 'system' | 'javascript' | 'react' | 'default';

const CourseBadgeIcon = ({ variant }: { variant: CourseBadgeVariant }) => {
    const baseClass =
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_18px_rgba(0,0,0,0.36)]';

    if (variant === 'system') {
        return (
            <span className={`${baseClass} bg-gradient-to-br from-[#00b7ff] to-[#007cff]`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#d7f4ff]" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M12 4 7 7v6c0 3.2 2.3 5.8 5 6.9 2.7-1.1 5-3.7 5-6.9V7l-5-3Z" />
                    <path d="M9.6 12.5h4.8M12 10.2v4.6" />
                </svg>
            </span>
        );
    }

    if (variant === 'javascript') {
        return (
            <span className={`${baseClass} bg-gradient-to-br from-[#ffbe00] to-[#ff7a00]`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#fff0c2]" fill="currentColor">
                    <path d="M13.2 3.8 6.7 13h4.3l-1.1 7.2L17.4 11h-4.3l.1-7.2Z" />
                </svg>
            </span>
        );
    }

    if (variant === 'react') {
        return (
            <span className={`${baseClass} bg-gradient-to-br from-[#ff2ca1] to-[#ff007a]`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#ffd2ea]" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <ellipse cx="12" cy="12" rx="8.2" ry="3.3" />
                    <ellipse cx="12" cy="12" rx="8.2" ry="3.3" transform="rotate(60 12 12)" />
                    <ellipse cx="12" cy="12" rx="8.2" ry="3.3" transform="rotate(120 12 12)" />
                    <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
                </svg>
            </span>
        );
    }

    if (variant === 'dsa') {
        return (
            <span className={`${baseClass} bg-gradient-to-br from-[#7b2cff] to-[#c34dff]`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#ffd6ff]" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="5" y="5" width="4" height="4" rx="0.8" />
                    <rect x="10" y="5" width="4" height="4" rx="0.8" />
                    <rect x="15" y="5" width="4" height="4" rx="0.8" />
                    <rect x="5" y="10" width="4" height="4" rx="0.8" />
                    <rect x="10" y="10" width="4" height="4" rx="0.8" />
                    <rect x="15" y="10" width="4" height="4" rx="0.8" />
                    <rect x="5" y="15" width="4" height="4" rx="0.8" />
                    <rect x="10" y="15" width="4" height="4" rx="0.8" />
                    <rect x="15" y="15" width="4" height="4" rx="0.8" />
                </svg>
            </span>
        );
    }

    return (
        <span className={`${baseClass} bg-gradient-to-br from-[#6a36ff] to-[#9c5dff]`}>
            <BookOpen size={17} className="text-[#eddcff]" />
        </span>
    );
};

const COURSE_VISUALS: CourseVisualConfig[] = [
    {
        badgeVariant: 'dsa',
        titleClass: 'text-white',
        barClass: 'from-[#8f3dff] to-[#b24dff]',
    },
    {
        badgeVariant: 'system',
        titleClass: 'text-white',
        barClass: 'from-[#00d2ff] to-[#0a7dff]',
    },
    {
        badgeVariant: 'javascript',
        titleClass: 'text-white',
        barClass: 'from-[#ffbf00] to-[#ff7b00]',
    },
    {
        badgeVariant: 'react',
        titleClass: 'text-white',
        barClass: 'from-[#ff2ca1] to-[#ff0070]',
    },
];

const COURSE_VISUAL_BY_KEYWORD: Array<{ keywords: string[]; visual: CourseVisualConfig }> = [
    {
        keywords: ['data structure', 'algorithm', 'dsa'],
        visual: {
            badgeVariant: 'dsa',
            titleClass: 'text-white',
            barClass: 'from-[#8f3dff] to-[#b24dff]',
        },
    },
    {
        keywords: ['system design', 'architecture', 'design'],
        visual: {
            badgeVariant: 'system',
            titleClass: 'text-white',
            barClass: 'from-[#00c8ff] to-[#2780ff]',
        },
    },
    {
        keywords: ['javascript', 'js', 'frontend', 'web'],
        visual: {
            badgeVariant: 'javascript',
            titleClass: 'text-white',
            barClass: 'from-[#ffbf00] to-[#ff7b00]',
        },
    },
    {
        keywords: ['react', 'next', 'ui', 'client'],
        visual: {
            badgeVariant: 'react',
            titleClass: 'text-white',
            barClass: 'from-[#ff2ca1] to-[#ff0070]',
        },
    },
];

const resolveCourseVisual = (courseTitle: string, index: number): CourseVisualConfig => {
    const normalized = courseTitle.toLowerCase();
    const keywordMatch = COURSE_VISUAL_BY_KEYWORD.find(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)));
    return keywordMatch?.visual || COURSE_VISUALS[index % COURSE_VISUALS.length];
};

const DashboardPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { socket, connected } = useSocket();
    const [showLegend, setShowLegend] = useState(false);
    const liveRefreshTimerRef = useRef<number | null>(null);

    const { data: dashboard, isLoading } = useQuery({
        queryKey: ['student-dashboard'],
        queryFn: () => dashboardService.getStudentData(),
        refetchInterval: connected ? false : 60000,
        refetchIntervalInBackground: false,
    });
    const { data: achievementSummary } = useQuery({
        queryKey: ['my-achievements'],
        queryFn: () => achievementService.getMyAchievements(),
        staleTime: 60_000,
    });

    useEffect(() => {
        if (!socket) {
            return;
        }

        const watchedEvents = [
            'QUIZ_COMPLETED',
            'PROBLEM_SOLVED',
            'PROBLEM_SUBMISSION_EVALUATED',
            'INTERVIEW_PROGRESS_UPDATE',
            'BADGE_UNLOCKED',
        ];

        const handleLiveActivity = () => {
            if (liveRefreshTimerRef.current) {
                window.clearTimeout(liveRefreshTimerRef.current);
            }

            liveRefreshTimerRef.current = window.setTimeout(() => {
                void queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
                void queryClient.invalidateQueries({ queryKey: ['my-achievements'] });
            }, 180);
        };

        watchedEvents.forEach((event) => socket.on(event, handleLiveActivity));

        return () => {
            watchedEvents.forEach((event) => socket.off(event, handleLiveActivity));
            if (liveRefreshTimerRef.current) {
                window.clearTimeout(liveRefreshTimerRef.current);
                liveRefreshTimerRef.current = null;
            }
        };
    }, [queryClient, socket]);

    const courseProgress: CourseProgressCard[] = (() => {
        if (dashboard?.courseProgress && dashboard.courseProgress.length > 0) {
            return dashboard.courseProgress.map((entry) => ({
                courseId: entry.courseId,
                courseTitle: entry.courseTitle,
                solvedProblems: entry.solvedProblems,
                attemptedProblems: entry.attemptedProblems,
                totalProblems: entry.totalProblems,
                completionPercent: entry.completionPercent,
            }));
        }

        if (dashboard?.continueLearning && dashboard.continueLearning.length > 0) {
            return dashboard.continueLearning.map((entry) => ({
                courseId: entry.id,
                courseTitle: entry.title,
                solvedProblems: entry.progress >= 100 ? 1 : 0,
                attemptedProblems: entry.progress > 0 ? 1 : 0,
                totalProblems: 1,
                completionPercent: entry.progress,
            }));
        }

        return (dashboard?.enrolledCourses || []).map((entry) => ({
            courseId: entry.id,
            courseTitle: entry.title,
            solvedProblems: 0,
            attemptedProblems: 0,
            totalProblems: 0,
            completionPercent: 0,
        }));
    })();

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="typ-muted">Synchronizing your progress...</p>
            </div>
        );
    }

    const stats: StatSectionItem[] = [
        {
            label: 'Courses Active',
            value: dashboard?.coursesEnrolled || 0,
            icon: <BookOpen size={20} />,
            tone: 'primary' as const,
            suffix: '',
            trend: '+12%',
            subLabel: '+1 this week',
        },
        {
            label: 'Problems Solved',
            value: dashboard?.problemsSolved || 0,
            icon: <Code size={20} />,
            tone: 'cyan' as const,
            suffix: '',
            trend: '+8%',
            subLabel: `${Math.max(0, Math.min(34, dashboard?.problemsSolved || 0))} this month`,
        },
        {
            label: 'Quiz Score',
            value: dashboard?.quizAverage || 0,
            icon: <Trophy size={20} />,
            tone: 'warning' as const,
            suffix: '%',
            trend: '+5%',
            subLabel: 'Avg last 5 quizzes',
        },
        {
            label: 'Interview Progress',
            value: dashboard?.interviewProgress || 0,
            icon: <Zap size={20} />,
            tone: 'danger' as const,
            suffix: '%',
            trend: '+18%',
            subLabel: `${Math.max(0, Math.round((dashboard?.interviewProgress || 0) / 5))} sessions done`,
        },
    ];
    const recentActivity = dashboard?.recentActivity || [];
    const recentProblemActivity = recentActivity.filter((item) => item.text.toLowerCase().includes('problem'));
    const achievementTotals = achievementSummary?.totals || {
        earned: 0,
        total: 0,
        completionPercent: 0,
    };
    const recentUnlockedBadges = achievementSummary?.recentUnlocked || [];
    const dayStreak = Math.max(0, dashboard?.streakDays || 0);
    const topPercent = Math.max(1, 100 - Math.min(95, Math.round((dashboard?.quizAverage || 0) * 0.6)));
    const solvedThisWeek = recentProblemActivity.length;
    const accuracy = Math.max(0, Math.round(dashboard?.quizAverage || 0));

    return (
        <>
            <div className="dashboard-premium-root dashboard-ref-shell relative isolate">
                <div className="dashboard-premium-bg pointer-events-none absolute inset-0 -z-10 overflow-hidden" />

                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6">
                    <motion.section
                        variants={fadeIn}
                        className="dashboard-hero-shell dashboard-ref-hero dashboard-hero-enter p-6 lg:p-8"
                    >
                        <div className="dashboard-hero-content space-y-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-4">
                                    <span className="dashboard-kicker dashboard-ref-kicker">
                                        <span className="dashboard-kicker-dot" />
                                        Live Tracking
                                    </span>
                                    <h1 className="dashboard-hero-title dashboard-ref-title">
                                        Your coding momentum
                                        <br />
                                        <span className="dashboard-live-row">
                                            <span className="dashboard-ref-accent dashboard-live-accent">is live.</span>
                                            <Rocket size={38} className="dashboard-live-rocket" />
                                        </span>
                                    </h1>
                                    <p className="dashboard-hero-subtitle dashboard-ref-subtitle">
                                        You're in the top <span className="dashboard-ref-inline-highlight">{topPercent}%</span> of
                                        learners this week. Keep pushing, your next milestone is just 3 problems away.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 self-stretch lg:w-[260px]">
                                    <div className="dashboard-ref-mini-card dashboard-ref-mini-card-lg col-span-2">
                                        <p className="dashboard-ref-mini-value">{dayStreak}</p>
                                        <p className="dashboard-ref-mini-label">Day Streak</p>
                                    </div>
                                    <div className="dashboard-ref-mini-card">
                                        <p className="dashboard-ref-mini-value dashboard-ref-cyan">{dashboard?.problemsSolved || 0}</p>
                                        <p className="dashboard-ref-mini-label">Solved</p>
                                    </div>
                                    <div className="dashboard-ref-mini-card">
                                        <p className="dashboard-ref-mini-value dashboard-ref-gold">{accuracy}%</p>
                                        <p className="dashboard-ref-mini-label">Accuracy</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    variant="primary"
                                    className="dashboard-ref-primary-btn"
                                    onClick={() => navigate('/app/courses')}
                                >
                                    Continue Learning <ArrowRight size={16} />
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="dashboard-ref-secondary-btn"
                                    onClick={() => setShowLegend(true)}
                                >
                                    <Radar size={16} />
                                    Set Goals
                                </Button>
                                <span className="dashboard-pill" style={{ animationDelay: '80ms' }}>
                                    <Sparkles size={13} />
                                    {connected ? 'Realtime Sync On' : 'Syncing'}
                                </span>
                                <span className="dashboard-pill" style={{ animationDelay: '140ms' }}>
                                    {achievementTotals.earned}/{achievementTotals.total} badges
                                </span>
                            </div>

                            <hr className="dashboard-divider dashboard-ref-divider" />
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="dashboard-metric">
                                    <span className="dashboard-metric-label">Courses Active</span>
                                    <span className="dashboard-metric-value">{dashboard?.coursesEnrolled || 0}</span>
                                </div>
                                <div className="dashboard-metric">
                                    <span className="dashboard-metric-label">Problems Solved</span>
                                    <span className="dashboard-metric-value">{dashboard?.problemsSolved || 0}</span>
                                </div>
                                <div className="dashboard-metric">
                                    <span className="dashboard-metric-label">Solved This Week</span>
                                    <span className="dashboard-metric-value">{solvedThisWeek}</span>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    <StatSection items={stats} />

                    <motion.section variants={staggerContainer} className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
                        <motion.div variants={fadeIn}>
                            <ActivityChart
                                activity={recentActivity}
                                onOpenProblems={() => navigate('/app/problems')}
                                onOpenQuizzes={() => navigate('/app/quizzes')}
                                liveConnected={connected}
                            />
                        </motion.div>

                        <motion.div variants={fadeIn}>
                            <Card variant="glass" className="dashboard-achievement-panel h-full space-y-4 p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="typ-h3 mb-1">Achievements</h3>
                                        <p className="typ-muted">Collection Progress</p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">
                                        {achievementTotals.earned}/{achievementTotals.total} unlocked
                                    </p>
                                </div>

                                <ProgressBar value={toPercent(achievementTotals.completionPercent)} className="dashboard-achievement-progress" />

                                <div className="space-y-3">
                                    {recentUnlockedBadges.length > 0 ? (
                                        recentUnlockedBadges.slice(0, 4).map((badge) => {
                                            const Icon = resolveAchievementIcon(badge.icon);
                                            return (
                                                <div key={badge.code} className="dashboard-achievement-row">
                                                    <span className="dashboard-achievement-icon">
                                                        <Icon size={15} />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold text-gray-900">{badge.title}</p>
                                                        <p className="truncate text-xs text-muted">{badge.description}</p>
                                                    </div>
                                                    <span className="dashboard-achievement-xp">+{Math.max(25, badge.progressCurrent * 5)} XP</span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="dashboard-achievement-row">
                                            <span className="dashboard-achievement-icon">
                                                <Sparkles size={15} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-gray-900">No badges yet</p>
                                                <p className="truncate text-xs text-muted">Solve problems to unlock achievements</p>
                                            </div>
                                            <span className="dashboard-achievement-xp">+0 XP</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    </motion.section>

                    <motion.section variants={staggerContainer} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <motion.div variants={fadeIn}>
                            <RecentProblems items={recentProblemActivity} onOpenProblems={() => navigate('/app/problems')} />
                        </motion.div>

                        <motion.div variants={fadeIn}>
                            <Card variant="glass" tilt={false} className="space-y-5 rounded-2xl border border-[#1a2130] bg-[#05070d]/95 p-5 md:p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="typ-h2 mb-0 flex items-center gap-2 !text-[1.82rem]">
                                            <BookOpen size={20} className="text-[#a771ff]" />
                                            Course Progress
                                        </h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/app/courses')}
                                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#9d62ff] transition-colors duration-200 hover:text-[#c194ff]"
                                    >
                                        Browse <ArrowRight size={14} />
                                    </button>
                                </div>

                                {courseProgress.length > 0 ? (
                                    <div className="space-y-4">
                                        {courseProgress.slice(0, 5).map((item, index) => {
                                            const visual = resolveCourseVisual(item.courseTitle, index);
                                            return (
                                                <div key={item.courseId} className="rounded-2xl border border-[#171d2a] bg-[#06080f] px-5 py-4 transition-all duration-200 hover:border-[#2a3145]">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="min-w-0 flex items-center gap-3">
                                                            <CourseBadgeIcon variant={visual.badgeVariant} />
                                                            <div className="min-w-0">
                                                                <h3 className={`truncate text-[0.96rem] font-semibold leading-tight ${visual.titleClass}`}>
                                                                    {item.courseTitle}
                                                                </h3>
                                                                <p className="text-[0.79rem] text-[#8c96af]">
                                                                    {item.solvedProblems}/{Math.max(item.totalProblems, 1)} lessons
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="text-[1.46rem] font-extrabold leading-none text-white">{toPercent(item.completionPercent)}%</p>
                                                    </div>
                                                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#111621]">
                                                        <span
                                                            className={`block h-full rounded-full bg-gradient-to-r ${visual.barClass}`}
                                                            style={{ width: `${toPercent(item.completionPercent)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <Card variant="glass" className="p-8 text-center">
                                        <p className="typ-body">
                                            No course progress available yet. Start solving problems to build your track
                                            record.
                                        </p>
                                    </Card>
                                )}
                            </Card>
                        </motion.div>
                    </motion.section>
                </motion.div>
            </div>

            <Modal
                isOpen={showLegend}
                onClose={() => setShowLegend(false)}
                title="Progress Status Legend"
                description="How course status badges are calculated."
                footer={
                    <div className="flex justify-end">
                        <Button variant="secondary" size="sm" onClick={() => setShowLegend(false)}>
                            Close
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Badge variant="success">Solved</Badge>
                        <p className="typ-muted">All course problems solved.</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <Badge variant="warning">Attempted</Badge>
                        <p className="typ-muted">At least one attempt exists.</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <Badge variant="muted">Not Started</Badge>
                        <p className="typ-muted">No attempts yet.</p>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default DashboardPage;
