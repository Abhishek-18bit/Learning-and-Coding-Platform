import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BookText, Layers3, Loader2, Search, Sparkles, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { courseService } from '../services/course.service';
import { problemService } from '../services/problem.service';
import { fadeIn, staggerContainer } from '../animations/variants';
import CourseCard from '../components/course/CourseCard';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/ui/Badge';

const CourseListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchValue, setSearchValue] = useState('');

    const { data, isLoading, isError } = useQuery({
        queryKey: ['courses'],
        queryFn: () => courseService.getAll(),
    });
    const { data: problems } = useQuery({
        queryKey: ['problems', 'all', 'course-counts'],
        queryFn: () => problemService.getAll(),
    });

    const problemCountByCourseId = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const problem of problems || []) {
            const courseId = problem.lesson?.courseId;
            if (!courseId) continue;
            counts[courseId] = (counts[courseId] || 0) + 1;
        }
        return counts;
    }, [problems]);
    const maxLessonCount = useMemo(
        () => Math.max(1, ...(data?.courses?.map((course) => course._count?.lessons || 0) || [1])),
        [data?.courses]
    );
    const filteredCourses = useMemo(() => {
        const keyword = searchValue.trim().toLowerCase();
        if (!keyword) return data?.courses || [];

        return (data?.courses || []).filter((course) => {
            const haystack = `${course.title} ${course.description || ''} ${course.teacher?.name || ''}`.toLowerCase();
            return haystack.includes(keyword);
        });
    }, [data?.courses, searchValue]);
    const totalLessons = useMemo(
        () => (data?.courses || []).reduce((count, course) => count + (course._count?.lessons || 0), 0),
        [data?.courses]
    );
    const totalProblems = useMemo(
        () =>
            Object.values(problemCountByCourseId).reduce((count, value) => count + (Number.isFinite(value) ? value : 0), 0),
        [problemCountByCourseId]
    );

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="typ-muted font-medium">Fetching catalog...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mx-auto w-full max-w-[120rem] space-y-6"
        >
            <motion.section variants={fadeIn} className="relative overflow-hidden rounded-[1.2rem] border border-border/80 bg-card/95 px-5 py-6 md:px-7">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_5%_0%,rgba(168,85,247,0.08),rgba(168,85,247,0)_56%),radial-gradient(120%_120%_at_95%_0%,rgba(34,211,238,0.08),rgba(34,211,238,0)_56%)]" />
                <div className="pointer-events-none absolute inset-0 opacity-28 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:26px_26px]" />

                <div className="relative z-10 space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="warning">CURATED PATHS</Badge>
                        <Badge variant="primary">{user?.role === 'TEACHER' ? 'TEACHER VIEW' : 'STUDENT VIEW'}</Badge>
                    </div>

                    <div>
                        <h1 className="typ-h1 !text-[clamp(1.7rem,3.2vw,2.5rem)] !leading-[1.08] !mb-2">Course Tracks</h1>
                        <p className="typ-muted !text-[0.92rem] max-w-3xl">
                            Focused learning tracks with structured modules, coding practice, and assessment checkpoints.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                        <div className="rounded-xl border border-border bg-surface/70 px-3 py-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Courses</p>
                            <p className="mt-1 text-base font-semibold text-gray-900">{data?.courses?.length || 0}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface/70 px-3 py-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Modules</p>
                            <p className="mt-1 text-base font-semibold text-gray-900">{totalLessons}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface/70 px-3 py-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Problems</p>
                            <p className="mt-1 text-base font-semibold text-gray-900">{totalProblems}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface/70 px-3 py-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Matched</p>
                            <p className="mt-1 text-base font-semibold text-gray-900">{filteredCourses.length}</p>
                        </div>
                    </div>

                    <div className="relative w-full md:max-w-lg">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder="Search by course, topic, or instructor..."
                            className="input-base pl-12 pr-4 py-3 font-medium"
                        />
                    </div>
                </div>
            </motion.section>

            <motion.section variants={fadeIn} className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mission-panel-title">
                            <BookText size={14} />
                            Subject Library
                        </p>
                        <h2 className="typ-h2 !text-[1.75rem] !mb-1 mt-2">Available Courses</h2>
                        <p className="typ-muted !text-sm">Choose a track and continue your learning mission.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mission-chip !px-3 !py-1 !text-[12px]">
                            <Layers3 size={13} />
                            Multi-module
                        </span>
                        <span className="mission-chip !px-3 !py-1 !text-[12px]">
                            <Target size={13} />
                            Exam aligned
                        </span>
                        <span className="mission-chip !px-3 !py-1 !text-[12px]">
                            <Sparkles size={13} />
                            Real progress
                        </span>
                    </div>
                </div>

                <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {filteredCourses.map((course) => (
                        <motion.article
                            key={course.id}
                            variants={fadeIn}
                            className="h-full"
                        >
                            <CourseCard
                                course={course}
                                problemCount={problemCountByCourseId[course.id] || 0}
                                progressPercent={Math.min(
                                    100,
                                    Math.round(
                                        ((course._count?.lessons || 0) / maxLessonCount) * 70 +
                                            Math.min((problemCountByCourseId[course.id] || 0) * 6, 30)
                                    )
                                )}
                                onOpen={() => navigate(`/app/course/${course.id}`)}
                            />
                        </motion.article>
                    ))}
                </motion.div>
            </motion.section>

            {isError && (
                <motion.div variants={fadeIn}>
                    <Card variant="layered" className="p-10 text-center">
                        <p className="text-error font-bold">Failed to load courses. Please try again later.</p>
                    </Card>
                </motion.div>
            )}

            {/* Empty State */}
            {filteredCourses.length === 0 && (
                <motion.div variants={fadeIn}>
                    <Card variant="layered" className="p-20 text-center">
                        <BookOpen size={64} className="mx-auto text-muted mb-6" />
                        <h3 className="typ-h3">{searchValue ? 'No course matches your search' : 'No courses available yet'}</h3>
                        <p className="typ-muted mt-2 max-w-sm mx-auto">
                            {searchValue
                                ? 'Try another keyword for title, topic, or instructor.'
                                : 'Check back soon for new content or contact your administrator.'}
                        </p>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
};

export default CourseListPage;


