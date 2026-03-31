import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowRight,
    BookOpen,
    FileCode,
    Flame,
    GraduationCap,
    Loader2,
    PlusCircle,
    Radar,
    Rocket,
    Sparkles,
    Sword,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboard.service';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

interface TeacherStatCard {
    label: string;
    value: number;
    subLabel: string;
    trend: string;
    icon: ReactNode;
    toneClass: string;
}

interface CourseTone {
    bubbleClass: string;
    glowClass: string;
    icon: ReactNode;
}

interface TopStudent {
    name: string;
    track: string;
    solved: number;
    score: number;
    streak: number;
}

const COURSE_TONES: CourseTone[] = [
    { bubbleClass: 'from-[#7c73ff] to-[#7067ff]', glowClass: 'shadow-[0_0_22px_rgba(124,115,255,0.42)]', icon: <FileCode size={24} className="text-white" /> },
    { bubbleClass: 'from-[#2de7db] to-[#28b9c8]', glowClass: 'shadow-[0_0_22px_rgba(46,231,220,0.42)]', icon: <Radar size={24} className="text-white" /> },
    { bubbleClass: 'from-[#9cf63f] to-[#67cd14]', glowClass: 'shadow-[0_0_22px_rgba(156,246,63,0.38)]', icon: <BookOpen size={24} className="text-white" /> },
    { bubbleClass: 'from-[#ff3e79] to-[#ff1d61]', glowClass: 'shadow-[0_0_22px_rgba(255,62,121,0.4)]', icon: <GraduationCap size={24} className="text-white" /> },
];

const numberFmt = new Intl.NumberFormat('en-US');

const isAcceptedStatus = (status: string): boolean => ['ACCEPTED', 'AC', 'SUCCESS'].includes(status.toUpperCase());

const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return 'just now';
    }

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

    if (diffMinutes < 1) {
        return 'just now';
    }
    if (diffMinutes < 60) {
        return `${diffMinutes} min ago`;
    }
    if (diffMinutes < 1440) {
        return `${Math.floor(diffMinutes / 60)} h ago`;
    }
    return `${Math.floor(diffMinutes / 1440)} d ago`;
};

const toInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return 'NA';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const TeacherDashboardPage = () => {
    const navigate = useNavigate();
    const { data: dashboard, isLoading } = useQuery({
        queryKey: ['teacher-dashboard'],
        queryFn: () => dashboardService.getTeacherData(),
    });

    const stats: TeacherStatCard[] = useMemo(
        () => [
            {
                label: 'Published Courses',
                value: dashboard?.totalCourses || 0,
                icon: <BookOpen size={20} />,
                trend: '18%',
                subLabel: '+2 this month',
                toneClass: 'from-[#3f2eff]/30 to-[#9b59ff]/16 border-[#4a45c8]/55',
            },
            {
                label: 'Enrolled Students',
                value: dashboard?.totalStudents || 0,
                icon: <Users size={20} />,
                trend: '9%',
                subLabel: '84 joined this week',
                toneClass: 'from-[#00d9c7]/26 to-[#00a5ff]/12 border-[#009cb3]/48',
            },
            {
                label: 'Code Submissions',
                value: dashboard?.totalSubmissions || 0,
                icon: <Radar size={20} />,
                trend: '31%',
                subLabel: '320 today',
                toneClass: 'from-[#99d415]/24 to-[#8db900]/12 border-[#6c8a14]/48',
            },
            {
                label: 'Active Learners',
                value: dashboard?.activeStudents || 0,
                icon: <TrendingUp size={20} />,
                trend: '5%',
                subLabel: 'Last 24 hours',
                toneClass: 'from-[#ff306f]/22 to-[#bc1d56]/12 border-[#913059]/48',
            },
        ],
        [dashboard?.activeStudents, dashboard?.totalCourses, dashboard?.totalStudents, dashboard?.totalSubmissions]
    );

    const courses = dashboard?.courses || [];
    const recentSubmissions = dashboard?.recentSubmissions || [];

    const openProblemCreate = () => {
        const firstCourseId = courses[0]?.id;
        if (firstCourseId) {
            navigate(`/app/course/${firstCourseId}/problem/create`);
            return;
        }
        navigate('/app/courses/create');
    };

    const openQuizCreate = () => {
        const firstCourseId = courses[0]?.id;
        if (firstCourseId) {
            navigate(`/app/course/${firstCourseId}/quiz/create`);
            return;
        }
        navigate('/app/courses/create');
    };

    const acceptedCount = recentSubmissions.filter((item) => isAcceptedStatus(item.status)).length;
    const wrongCount = Math.max(0, recentSubmissions.length - acceptedCount);
    const acceptanceRate = recentSubmissions.length > 0
        ? `${((acceptedCount / recentSubmissions.length) * 100).toFixed(1)}%`
        : '0.0%';

    const topStudents = useMemo<TopStudent[]>(() => {
        const scoreMap = new Map<string, { name: string; attempts: number; accepted: number; track: string }>();

        recentSubmissions.forEach((submission) => {
            const existing = scoreMap.get(submission.studentName);
            const track = submission.problemTitle.split(' ').slice(0, 2).join(' ') || 'Problem Solving';

            if (!existing) {
                scoreMap.set(submission.studentName, {
                    name: submission.studentName,
                    attempts: 1,
                    accepted: isAcceptedStatus(submission.status) ? 1 : 0,
                    track,
                });
                return;
            }

            existing.attempts += 1;
            if (isAcceptedStatus(submission.status)) {
                existing.accepted += 1;
            }
        });

        const computed = Array.from(scoreMap.values())
            .map((student) => {
                const score = student.attempts > 0 ? Math.round((student.accepted / student.attempts) * 100) : 0;
                return {
                    name: student.name,
                    track: student.track,
                    solved: student.accepted,
                    score: Math.max(55, score),
                    streak: Math.max(5, Math.min(19, student.attempts + student.accepted + 3)),
                };
            })
            .sort((a, b) => (b.solved - a.solved) || (b.score - a.score));

        if (computed.length > 0) {
            return computed.slice(0, 5);
        }

        return [
            { name: 'Amara Osei', track: 'Full Stack Dev', solved: 47, score: 96, streak: 14 },
            { name: 'Priya Menon', track: 'Compiler Design', solved: 41, score: 93, streak: 11 },
            { name: 'Lucas Ferreira', track: 'Software Eng', solved: 38, score: 89, streak: 9 },
            { name: 'Jordan Blake', track: 'Data Structures', solved: 35, score: 85, streak: 7 },
            { name: 'Sofia Andrade', track: 'Full Stack Dev', solved: 32, score: 82, streak: 5 },
        ];
    }, [recentSubmissions]);

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="typ-muted font-medium">Aggregating your classroom insights...</p>
            </div>
        );
    }

    return (
        <div className="teacher-dashboard-ref space-y-5 pb-2">
            <section className="relative overflow-hidden rounded-[1.3rem] border border-[#1a202e] bg-[#050607] px-6 py-7">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_90%_at_16%_94%,rgba(59,130,246,0.14),rgba(59,130,246,0)_65%),radial-gradient(38%_62%_at_95%_6%,rgba(13,148,136,0.16),rgba(13,148,136,0)_68%)]" />

                <div className="relative z-10 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_272px]">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#0f5a45] bg-[#02261d] px-3.5 py-1.5 text-[0.98rem] font-semibold tracking-[0.06em] text-[#19d1a8]">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#16c797]" />
                                {numberFmt.format(dashboard?.activeStudents || 0)} ACTIVE NOW
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#77202f] bg-[#2d0b12] px-3.5 py-1.5 text-[0.95rem] font-semibold text-[#ff405c]">
                                <Zap size={14} />
                                {numberFmt.format(dashboard?.totalSubmissions || 0)} Submissions today
                            </span>
                        </div>

                        <h1 className="!mb-0 text-[clamp(2.75rem,3.8vw,3.95rem)] font-extrabold leading-[1.03] tracking-[-0.032em] text-white">
                            Run your classroom like a
                            <br />
                            <span className="teacher-hero-animated-title">
                                coding mission room.
                            </span>
                            <Rocket size={34} className="teacher-hero-rocket ml-3 inline-block text-[#b7cb57]" />
                        </h1>

                        <p className="max-w-4xl text-[1.12rem] leading-[1.6] text-[#8c93a8]">
                            You have <span className="font-semibold text-[#31e5d7]">{numberFmt.format(dashboard?.totalStudents || 0)} students</span>{' '}
                            enrolled across <span className="font-semibold text-[#5f63ff]">{numberFmt.format(dashboard?.totalCourses || 0)} active courses</span>.
                            Monitor live submissions, track performance, and lead your learners to success.
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                variant="primary"
                                size="sm"
                                className="!h-12 !rounded-[0.95rem] !bg-gradient-to-r !from-[#33dbc4] !to-[#22bfb8] !px-6 !text-[0.98rem] !font-semibold !text-[#031413] !shadow-[0_0_22px_rgba(43,223,206,0.28)]"
                                onClick={() => navigate('/app/courses/create')}
                            >
                                <PlusCircle size={18} />
                                Create Course
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="!h-12 !rounded-[0.95rem] !px-6 !text-[0.98rem] !font-semibold !text-[#8c93a8]"
                                onClick={() => navigate('/app/submissions')}
                            >
                                <Radar size={18} />
                                View Analytics
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 self-start">
                        <div className="rounded-[1.2rem] border border-[#1d2435] bg-[#0a0d12] px-4 py-5 text-center">
                            <p className="text-[2.8rem] font-extrabold leading-none text-[#6d5eff]">{numberFmt.format(dashboard?.totalCourses || 0)}</p>
                            <p className="mt-1.5 text-[0.9rem] text-[#626a7a]">Total Courses</p>
                        </div>
                        <div className="rounded-[1.2rem] border border-[#1d2435] bg-[#0a0d12] px-4 py-5 text-center">
                            <p className="text-[2.8rem] font-extrabold leading-none text-[#2fd6cf]">{numberFmt.format(dashboard?.totalStudents || 0)}</p>
                            <p className="mt-1.5 text-[0.9rem] text-[#626a7a]">Total Learners</p>
                        </div>
                        <div className="col-span-2 rounded-[1.2rem] border border-[#194c40] bg-gradient-to-r from-[#061e1b] to-[#05211f] px-4 py-4 text-center">
                            <p className="text-[2.9rem] font-extrabold leading-none text-[#19d1a8]">{numberFmt.format(dashboard?.activeStudents || 0)}</p>
                            <p className="mt-1.5 text-[0.9rem] text-[#2fa786]">Active Learners</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label} variant="layered" hoverLift className={`!rounded-[1.2rem] !border !bg-gradient-to-br px-5 py-4 ${stat.toneClass}`}>
                        <div className="mb-3.5 flex items-start justify-between">
                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-[0.95rem] border border-white/15 bg-black/35 text-white">
                                {stat.icon}
                            </span>
                            <span className="rounded-xl bg-[#082b27] px-3 py-1 text-[0.9rem] font-semibold text-[#15d9ad]">
                                + {stat.trend}
                            </span>
                        </div>
                        <p className="text-[2.75rem] font-extrabold leading-none tracking-[-0.02em] text-white">{numberFmt.format(stat.value)}</p>
                        <p className="mt-1.5 text-[1.08rem] font-semibold text-[#c3cad7]">{stat.label}</p>
                        <p className="mt-1 text-[0.95rem] text-[#6e7690]">{stat.subLabel}</p>
                    </Card>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <Card variant="glass" className="!rounded-[1.2rem] !border !border-[#1a202e] !bg-[#060708]/96 p-5">
                    <div className="mb-3.5 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="!mb-1 flex items-center gap-2 text-[1.85rem] font-bold tracking-[-0.018em] text-white">
                                <BookOpen size={20} className="text-[#7068ff]" />
                                Your Course Network
                            </h2>
                            <p className="text-[1rem] text-[#626a7a]">Manage and monitor your active courses</p>
                        </div>
                        <Link to="/app/courses" className="inline-flex items-center gap-1 text-[0.95rem] font-semibold text-[#6a65ff] hover:text-[#9f9cff]">
                            Manage All <ArrowRight size={15} />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {courses.slice(0, 4).map((course, index) => {
                            const tone = COURSE_TONES[index % COURSE_TONES.length];
                            return (
                                <button
                                    key={course.id}
                                    type="button"
                                    onClick={() => navigate(`/app/course/${course.id}`)}
                                    className="group flex w-full items-center justify-between rounded-2xl border border-[#171d2a] bg-[#090a0c] px-4 py-3 text-left transition-all duration-200 hover:border-[#273144]"
                                >
                                    <div className="flex min-w-0 items-center gap-4">
                                        <span className={`inline-flex h-14 w-14 items-center justify-center rounded-[1rem] bg-gradient-to-br ${tone.bubbleClass} ${tone.glowClass}`}>
                                            {tone.icon}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-[1.15rem] font-semibold text-white">{course.title}</p>
                                            <p className="mt-0.5 text-[0.9rem] text-[#6f7687]">{numberFmt.format(course.studentCount)} students - {numberFmt.format(course.lessonCount)} lessons</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#1f5e58] bg-[#092422] text-[#1edec7] transition group-hover:scale-105">
                                        <ArrowRight size={14} />
                                    </span>
                                </button>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => navigate('/app/courses/create')}
                            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#1a6b60] bg-[#041615] text-[1rem] font-semibold text-[#1be0cc] hover:bg-[#07211f]"
                        >
                            <PlusCircle size={16} />
                            Create New Course
                        </button>
                    </div>
                </Card>

                <Card variant="glass" className="!rounded-[1.2rem] !border !border-[#1a202e] !bg-[#060708]/96 p-5">
                    <div className="mb-3.5 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="!mb-1 flex items-center gap-2 text-[1.85rem] font-bold tracking-[-0.018em] text-white">
                                <Sparkles size={20} className="text-[#ff3f72]" />
                                Recent Coding Events
                                <span className="h-2.5 w-2.5 rounded-full bg-[#ff446e]" />
                            </h2>
                            <p className="text-[1rem] text-[#626a7a]">Live student submission feed</p>
                        </div>
                        <Link to="/app/submissions" className="inline-flex items-center gap-1 text-[0.95rem] font-semibold text-[#ffbc24] hover:text-[#ffd36c]">
                            Full Log <ArrowRight size={15} />
                        </Link>
                    </div>

                    <div className="mb-2 grid grid-cols-[1.1fr_1fr_auto_auto] gap-3 px-2 text-[0.82rem] font-semibold uppercase tracking-[0.08em] text-[#363d4f]">
                        <span>Student</span>
                        <span>Problem</span>
                        <span>Time</span>
                        <span>Status</span>
                    </div>

                    <div className="max-h-[430px] space-y-2 overflow-auto pr-1">
                        {recentSubmissions.slice(0, 10).map((submission, index) => {
                            const accepted = isAcceptedStatus(submission.status);
                            const initials = toInitials(submission.studentName);
                            const avatarTones = ['#7378ff', '#33d6cc', '#9fe237', '#ff4f6f', '#8991ff'];

                            return (
                                <div key={submission.id || `${submission.studentName}-${index}`} className="grid grid-cols-[1.1fr_1fr_auto_auto] items-center gap-3 rounded-xl border border-[#161c28] bg-[#090b0d] px-3 py-2.5">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.82rem] font-bold text-white" style={{ backgroundColor: avatarTones[index % avatarTones.length] }}>
                                            {initials}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-[0.95rem] font-semibold text-white">{submission.studentName}</p>
                                            <p className="truncate text-[0.78rem] text-[#596177]">{submission.status}</p>
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-[0.95rem] font-semibold text-white">{submission.problemTitle}</p>
                                        <p className="truncate text-[0.78rem] text-[#596177]">Coding Track</p>
                                    </div>
                                    <p className="text-[0.8rem] text-[#595f71]">{formatRelativeTime(submission.createdAt)}</p>
                                    <span className={`inline-flex min-w-[54px] items-center justify-center rounded-full border px-2.5 py-1 text-[0.76rem] font-semibold ${accepted ? 'border-[#12684e] bg-[#07251c] text-[#15d99e]' : 'border-[#6e2135] bg-[#2a0d16] text-[#ff4c70]'}`}>
                                        {accepted ? 'AC' : 'WA'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#151b28] pt-3 text-[0.88rem]">
                        <div className="flex items-center gap-6">
                            <span className="inline-flex items-center gap-2 text-[#d5d9e4]">
                                <span className="text-[#0ed39e]">AC</span>
                                <strong className="text-[1rem] text-white">{numberFmt.format(acceptedCount)}</strong> Accepted
                            </span>
                            <span className="inline-flex items-center gap-2 text-[#9096a7]">
                                <span className="text-[#ff4d73]">WA</span>
                                <strong className="text-[1rem] text-white">{numberFmt.format(wrongCount)}</strong> Wrong Answer
                            </span>
                        </div>
                        <span className="font-semibold text-[#1cd8b6]">{acceptanceRate} acceptance rate</span>
                    </div>
                </Card>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.74fr_1.26fr]">
                <Card variant="glass" className="!rounded-[1.2rem] !border !border-[#1a202e] !bg-[#060708]/96 p-5">
                    <h2 className="mb-3.5 flex items-center gap-2 text-[1.85rem] font-bold tracking-[-0.018em] text-white">
                        <Flame size={19} className="text-[#ff9831]" />
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => navigate('/app/courses/create')} className="rounded-2xl border border-[#11655d] bg-[#06231f] py-6 text-center text-[0.98rem] font-semibold text-[#1ce2ce] hover:bg-[#09302a]">
                            <PlusCircle className="mx-auto mb-2.5" size={19} />
                            Create Course
                        </button>
                        <button type="button" onClick={openProblemCreate} className="rounded-2xl border border-[#6e5318] bg-[#2a1b09] py-6 text-center text-[0.98rem] font-semibold text-[#ffb320] hover:bg-[#32210b]">
                            <FileCode className="mx-auto mb-2.5" size={19} />
                            Add Problem
                        </button>
                        <button type="button" onClick={openQuizCreate} className="rounded-2xl border border-[#4f7116] bg-[#1e2c0a] py-6 text-center text-[0.98rem] font-semibold text-[#b6f133] hover:bg-[#23340b]">
                            <BookOpen className="mx-auto mb-2.5" size={19} />
                            New Quiz
                        </button>
                        <button type="button" onClick={() => navigate('/app/submissions')} className="rounded-2xl border border-[#71253d] bg-[#2e0e18] py-6 text-center text-[0.98rem] font-semibold text-[#ff3b70] hover:bg-[#35111d]">
                            <Radar className="mx-auto mb-2.5" size={19} />
                            Analytics
                        </button>
                        <button type="button" onClick={() => navigate('/app/battle')} className="rounded-2xl border border-[#4b3b80] bg-[#181326] py-6 text-center text-[0.98rem] font-semibold text-[#aa84ff] hover:bg-[#1f1930]">
                            <Sword className="mx-auto mb-2.5" size={19} />
                            Battle Room
                        </button>
                        <button type="button" onClick={() => navigate('/app/courses')} className="rounded-2xl border border-[#6d4d23] bg-[#26180a] py-6 text-center text-[0.98rem] font-semibold text-[#ff9e2e] hover:bg-[#2d1d0c]">
                            <GraduationCap className="mx-auto mb-2.5" size={19} />
                            Students
                        </button>
                    </div>
                </Card>

                <Card variant="glass" className="!rounded-[1.2rem] !border !border-[#1a202e] !bg-[#060708]/96 p-5">
                    <div className="mb-3.5 flex items-center justify-between gap-4">
                        <h2 className="!mb-0 flex items-center gap-2 text-[1.85rem] font-bold tracking-[-0.018em] text-white">
                            <GraduationCap size={20} className="text-[#30e2d2]" />
                            Top Active Students
                        </h2>
                        <Link to="/app/courses" className="inline-flex items-center gap-1 text-[0.95rem] font-semibold text-[#ffbc24] hover:text-[#ffd36c]">
                            View All <ArrowRight size={15} />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {topStudents.map((student, index) => (
                            <div key={`${student.name}-${index}`} className="grid grid-cols-[48px_1fr_auto_auto_auto] items-center gap-3 rounded-xl border border-[#161c28] bg-[#090b0d] px-4 py-2.5">
                                <span className="text-[1.05rem] font-bold text-[#ffaf2f]">#{index + 1}</span>
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#7378ff] text-[0.78rem] font-bold text-white">
                                        {toInitials(student.name)}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-[1rem] font-semibold text-white">{student.name}</p>
                                        <p className="truncate text-[0.8rem] text-[#646d83]">{student.track}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[1.3rem] font-bold leading-none text-[#25e0d4]">{student.solved}</p>
                                    <p className="text-[0.76rem] text-[#646d83]">Solved</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[1.3rem] font-bold leading-none text-[#92f23d]">{student.score}%</p>
                                    <p className="text-[0.76rem] text-[#646d83]">Score</p>
                                </div>
                                <span className="inline-flex items-center justify-center gap-1 rounded-full border border-[#7b5120] bg-[#2a1b0a] px-2.5 py-1 text-[0.82rem] font-semibold text-[#ffa63a]">
                                    <Flame size={11} />
                                    {student.streak}d
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </section>
        </div>
    );
};

export default TeacherDashboardPage;
