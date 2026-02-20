import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronRight, Code2, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-headlines">Coding Problems</h1>
                    <p className="text-secondary mt-1">
                        {isTeacher
                            ? 'Create, manage, and review coding challenges.'
                            : 'Browse available coding challenges and start solving.'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-gray-600">Difficulty</label>
                    <select
                        value={difficultyFilter}
                        onChange={(event) => setDifficultyFilter(event.target.value as 'ALL' | 'EASY' | 'MEDIUM' | 'HARD')}
                        className="rounded-lg border border-gray-200 px-3 py-2 bg-white text-sm"
                    >
                        <option value="ALL">All</option>
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                    </select>
                </div>
            </div>

            {isTeacher && (
                <section className="card-premium space-y-4">
                    <h2 className="text-lg font-bold text-gray-900">Create Problem</h2>
                    <p className="text-sm text-secondary">
                        Select course and lesson. Lesson selection is mandatory so problems are visible in lesson flow.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                            value={selectedCourseId}
                            onChange={(event) => {
                                setSelectedCourseId(event.target.value);
                                setSelectedLessonId('');
                            }}
                            className="rounded-lg border border-gray-200 px-3 py-2 bg-white text-sm"
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
                            className="rounded-lg border border-gray-200 px-3 py-2 bg-white text-sm"
                            disabled={!selectedCourseId || lessonsQuery.isLoading}
                        >
                            <option value="">Select Lesson</option>
                            {(lessonsQuery.data || []).map((lesson) => (
                                <option key={lesson.id} value={lesson.id}>
                                    {lesson.title}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            disabled={!selectedLessonId}
                            onClick={() => navigate(`/app/lesson/${selectedLessonId}/problem/create`)}
                            className="btn-gradient py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            <Plus size={16} />
                            New Problem
                        </button>
                    </div>
                </section>
            )}

            {problemsQuery.isLoading ? (
                <div className="h-56 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={28} />
                </div>
            ) : filteredProblems.length > 0 ? (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProblems.map((problem) => (
                        <article key={problem.id} className="card-premium">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                        <Code2 size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">{problem.title}</h3>
                                        <p className="text-xs text-secondary mt-1 line-clamp-2">{problem.description}</p>
                                    </div>
                                </div>
                                <span
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 ${problem.difficulty === 'EASY'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : problem.difficulty === 'MEDIUM'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-rose-100 text-rose-700'
                                        }`}
                                >
                                    {problem.difficulty}
                                </span>
                            </div>

                            <div className="mt-4 text-xs text-secondary space-y-1">
                                <p className="inline-flex items-center gap-1">
                                    <BookOpen size={12} />
                                    {problem.lesson?.title || 'No lesson linked'}
                                </p>
                                <p>{problem.lesson?.course?.title || 'No course context'}</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate(`/app/problem/${problem.id}`)}
                                className="mt-5 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-2"
                            >
                                {user.role === 'STUDENT' ? 'Solve Problem' : 'Open Problem'}
                                <ChevronRight size={16} />
                            </button>
                        </article>
                    ))}
                </section>
            ) : (
                <section className="card-premium py-12 text-center space-y-2">
                    <p className="text-gray-900 font-semibold">No problems found.</p>
                    <p className="text-sm text-secondary">
                        {isTeacher
                            ? 'Create your first problem from the panel above.'
                            : 'Ask your teacher to publish lesson-linked coding problems.'}
                    </p>
                </section>
            )}
        </div>
    );
};

export default ProblemsListPage;
