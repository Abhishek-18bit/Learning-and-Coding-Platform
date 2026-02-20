import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Code, Loader2, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardService } from '../services/dashboard.service';
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

type ProgressBadge = 'Solved' | 'Attempted' | 'Not Started';

interface CourseProgressCard {
    courseId: string;
    courseTitle: string;
    solvedProblems: number;
    attemptedProblems: number;
    totalProblems: number;
    completionPercent: number;
}

const badgeVariants: Record<ProgressBadge, 'success' | 'warning' | 'muted'> = {
    Solved: 'success',
    Attempted: 'warning',
    'Not Started': 'muted',
};

const getStatus = (item: CourseProgressCard): ProgressBadge => {
    if (item.totalProblems > 0 && item.solvedProblems >= item.totalProblems) return 'Solved';
    if (item.attemptedProblems > 0 || item.completionPercent > 0) return 'Attempted';
    return 'Not Started';
};

const toPercent = (value: number) => Math.max(0, Math.min(100, value));

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

    useEffect(() => {
        if (!socket) {
            return;
        }

        const watchedEvents = [
            'QUIZ_COMPLETED',
            'PROBLEM_SOLVED',
            'PROBLEM_SUBMISSION_EVALUATED',
            'INTERVIEW_PROGRESS_UPDATE',
        ];

        const handleLiveActivity = () => {
            if (liveRefreshTimerRef.current) {
                window.clearTimeout(liveRefreshTimerRef.current);
            }

            liveRefreshTimerRef.current = window.setTimeout(() => {
                void queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
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
            label: 'Courses in Progress',
            value: dashboard?.coursesEnrolled || 0,
            icon: <BookOpen size={20} />,
            tone: 'primary' as const,
            suffix: '',
        },
        {
            label: 'Problems Solved',
            value: dashboard?.problemsSolved || 0,
            icon: <Code size={20} />,
            tone: 'cyan' as const,
            suffix: '',
        },
        {
            label: 'Avg Quiz Score',
            value: dashboard?.quizAverage || 0,
            icon: <Trophy size={20} />,
            tone: 'warning' as const,
            suffix: '%',
        },
        {
            label: 'Interview Progress',
            value: dashboard?.interviewProgress || 0,
            icon: <Zap size={20} />,
            tone: 'danger' as const,
            suffix: '%',
        },
    ];
    const featuredCourse = dashboard?.continueLearning?.[0];
    const recentActivity = dashboard?.recentActivity || [];
    const recentProblemActivity = recentActivity.filter((item) => item.text.toLowerCase().includes('problem'));

    return (
        <>
            <div className="relative isolate">
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary-cyan/15 blur-3xl" />
                    <div className="absolute right-[-6rem] top-1/3 h-80 w-80 rounded-full bg-primary-violet/15 blur-3xl" />
                    <div className="absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-primary-blue/10 blur-3xl" />
                </div>

                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8">
                    <motion.section
                        variants={fadeIn}
                        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                        <div>
                            <h1 className="typ-h1 mb-1">Welcome back</h1>
                            <p className="typ-muted">Track your coding performance and keep your momentum steady.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="success">Live Updates Active</Badge>
                            <Button variant="ghost" size="sm" onClick={() => setShowLegend(true)}>
                                Status Legend
                            </Button>
                        </div>
                    </motion.section>

                    <StatSection items={stats} />

                    <motion.section variants={staggerContainer} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <motion.div variants={fadeIn} className="xl:col-span-1">
                            <Card variant="glass" className="h-full space-y-5">
                                <Badge variant="primary">Continue Learning</Badge>
                                {featuredCourse ? (
                                    <>
                                        <div>
                                            <h2 className="typ-h2 !text-2xl mb-1">{featuredCourse.title}</h2>
                                            <p className="typ-muted">
                                                Next up: <span className="text-gray-700">{featuredCourse.nextLesson}</span>
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <ProgressBar value={toPercent(featuredCourse.progress)} />
                                            <p className="typ-muted">{toPercent(featuredCourse.progress)}% course progress</p>
                                        </div>
                                        <Button
                                            variant="primary"
                                            className="w-full"
                                            onClick={() => navigate('/app/courses')}
                                        >
                                            Continue Course <ArrowRight size={16} />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p className="typ-body">
                                            You do not have an active course right now. Start one to unlock smart tracking.
                                        </p>
                                        <Button
                                            variant="secondary"
                                            className="w-full"
                                            onClick={() => navigate('/app/courses')}
                                        >
                                            Explore Courses
                                        </Button>
                                    </>
                                )}
                            </Card>
                        </motion.div>
                        <motion.div variants={fadeIn} className="xl:col-span-2">
                            <ActivityChart
                                activity={recentActivity}
                                onOpenProblems={() => navigate('/app/problems')}
                                onOpenQuizzes={() => navigate('/app/quizzes')}
                                liveConnected={connected}
                            />
                        </motion.div>
                    </motion.section>

                    <motion.section variants={staggerContainer} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <motion.div variants={fadeIn} className="xl:col-span-1">
                            <RecentProblems items={recentProblemActivity} onOpenProblems={() => navigate('/app/problems')} />
                        </motion.div>

                        <motion.div variants={fadeIn} className="xl:col-span-2">
                            <Card variant="layered" className="space-y-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="typ-h2 mb-1">Problem Progress by Course</h2>
                                        <p className="typ-muted">Solved, attempted, and untouched tracks at a glance.</p>
                                    </div>
                                    <Button variant="secondary" size="sm" onClick={() => navigate('/app/courses')}>
                                        View Courses
                                    </Button>
                                </div>

                                {courseProgress.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {courseProgress.map((item) => {
                                            const status = getStatus(item);
                                            return (
                                                <Card key={item.courseId} variant="glass" className="p-4 space-y-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <h3 className="typ-h3 !text-xl mb-0">{item.courseTitle}</h3>
                                                        <Badge variant={badgeVariants[status]}>{status}</Badge>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <p className="typ-muted uppercase">Solved</p>
                                                            <p className="text-xl font-bold text-gray-900">{item.solvedProblems}</p>
                                                        </div>
                                                        <div>
                                                            <p className="typ-muted uppercase">Attempted</p>
                                                            <p className="text-xl font-bold text-gray-900">{item.attemptedProblems}</p>
                                                        </div>
                                                        <div>
                                                            <p className="typ-muted uppercase">Total</p>
                                                            <p className="text-xl font-bold text-gray-900">{item.totalProblems}</p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <ProgressBar value={toPercent(item.completionPercent)} />
                                                        <p className="typ-muted mt-2">{toPercent(item.completionPercent)}% complete</p>
                                                    </div>
                                                </Card>
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
