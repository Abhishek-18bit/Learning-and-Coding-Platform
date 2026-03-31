import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Code2, Loader2, Plus, Radar, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { courseService } from '../services/course.service';
import { lessonService } from '../services/lesson.service';
import { problemService } from '../services/problem.service';

const ProblemsListPage = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedLessonId, setSelectedLessonId] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');

    const problemsQuery = useQuery({
        queryKey: ['problems', 'all'],
        queryFn: () => problemService.getAll(),
    });

    const coursesQuery = useQuery({
        queryKey: ['courses', 'teacher-problem-builder'],
        queryFn: () => courseService.getAll(1, 100),
        enabled: isTeacher,
    });

    const lessonsQuery = useQuery({
        queryKey: ['course-lessons', selectedCourseId, 'problem-builder'],
        queryFn: () => lessonService.getByCourseId(selectedCourseId),
        enabled: isTeacher && Boolean(selectedCourseId),
    });

    const filteredProblems = useMemo(() => {
        const data = problemsQuery.data || [];
        if (difficultyFilter === 'ALL') return data;
        return data.filter((item) => item.difficulty === difficultyFilter);
    }, [problemsQuery.data, difficultyFilter]);

    const difficultyCounts = useMemo(() => {
        const data = problemsQuery.data || [];
        return {
            ALL: data.length,
            EASY: data.filter((problem) => problem.difficulty === 'EASY').length,
            MEDIUM: data.filter((problem) => problem.difficulty === 'MEDIUM').length,
            HARD: data.filter((problem) => problem.difficulty === 'HARD').length,
        };
    }, [problemsQuery.data]);

    if (authLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={30} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="mission-page">
            <section className="mission-shell p-6 lg:p-7">
                <div className="mission-shell-content flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <span className="mission-kicker">
                            <span className="mission-kicker-dot" />
                            Coding Problem Library
                        </span>
                        <h1 className="mission-title mt-3">Build and solve real coding challenges</h1>
                        <p className="mission-subtitle">
                            {isTeacher
                                ? 'Create lesson-linked problems and monitor challenge coverage across courses.'
                                : 'Browse published challenges and sharpen your problem-solving skill track.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mission-chip">
                            <Radar size={13} />
                            {difficultyCounts.ALL} total problems
                        </span>
                        <span className="mission-chip">
                            <BookOpen size={13} />
                            {difficultyCounts.MEDIUM} medium level
                        </span>
                    </div>
                </div>
            </section>

            <Card variant="glass" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mission-panel-title">
                            <SlidersHorizontal size={14} />
                            Filters
                        </p>
                        <h2 className="typ-h2 !text-2xl mt-2 mb-1">Problem stream controls</h2>
                        <p className="typ-muted">Switch difficulty or create new lesson-linked challenges.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((level) => {
                            const active = difficultyFilter === level;
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setDifficultyFilter(level)}
                                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition dur-fast ${
                                        active
                                            ? 'border-primary-blue/55 bg-primary-blue/20 text-primary-cyan'
                                            : 'border-border bg-card/70 text-muted hover:text-gray-700'
                                    }`}
                                >
                                    {level} ({difficultyCounts[level]})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {isTeacher ? (
                    <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 md:grid-cols-3">
                        <select
                            value={selectedCourseId}
                            onChange={(event) => {
                                setSelectedCourseId(event.target.value);
                                setSelectedLessonId('');
                            }}
                            className="input-base"
                            disabled={coursesQuery.isLoading}
                        >
                            <option value="">Select Course</option>
                            {(coursesQuery.data?.courses || []).map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedLessonId}
                            onChange={(event) => setSelectedLessonId(event.target.value)}
                            className="input-base"
                            disabled={!selectedCourseId || lessonsQuery.isLoading}
                        >
                            <option value="">Select Lesson</option>
                            {(lessonsQuery.data || []).map((lesson) => (
                                <option key={lesson.id} value={lesson.id}>
                                    {lesson.title}
                                </option>
                            ))}
                        </select>

                        <Button
                            variant="primary"
                            disabled={!selectedLessonId}
                            onClick={() => navigate(`/app/lesson/${selectedLessonId}/problem/create`)}
                        >
                            <Plus size={15} />
                            New Problem
                        </Button>
                    </div>
                ) : null}
            </Card>

            {problemsQuery.isLoading ? (
                <div className="h-56 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={28} />
                </div>
            ) : filteredProblems.length > 0 ? (
                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProblems.map((problem) => (
                        <Card key={problem.id} variant="layered" hoverLift className="space-y-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-blue/15 text-primary-cyan">
                                    <Code2 size={18} />
                                </div>
                                <Badge
                                    variant={
                                        problem.difficulty === 'EASY'
                                            ? 'success'
                                            : problem.difficulty === 'MEDIUM'
                                              ? 'warning'
                                              : 'error'
                                    }
                                >
                                    {problem.difficulty}
                                </Badge>
                            </div>

                            <div>
                                <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{problem.title}</h3>
                                <p className="mt-2 text-sm text-muted line-clamp-3">{problem.description}</p>
                            </div>

                            <div className="space-y-1 text-xs text-muted">
                                <p className="inline-flex items-center gap-1">
                                    <BookOpen size={12} />
                                    {problem.lesson?.title || 'No lesson linked'}
                                </p>
                                <p>{problem.lesson?.course?.title || 'No course context'}</p>
                            </div>

                            <Button
                                variant="secondary"
                                fullWidth
                                onClick={() => navigate(`/app/problem/${problem.id}`)}
                            >
                                {user.role === 'STUDENT' ? 'Solve Problem' : 'Open Problem'}
                                <ArrowRight size={14} />
                            </Button>
                        </Card>
                    ))}
                </section>
            ) : (
                <Card variant="layered" className="py-14 text-center space-y-2">
                    <p className="text-gray-900 font-semibold">No problems found.</p>
                    <p className="text-sm text-muted">
                        {isTeacher
                            ? 'Create your first problem from the panel above.'
                            : 'Ask your teacher to publish lesson-linked coding problems.'}
                    </p>
                </Card>
            )}
        </div>
    );
};

export default ProblemsListPage;
