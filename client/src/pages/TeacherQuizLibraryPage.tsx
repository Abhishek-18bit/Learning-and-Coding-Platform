import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, BookOpen, CalendarDays, ClipboardCheck, Filter, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboard.service';
import { quizService, type Quiz, type QuizSourceType } from '../services/quiz.service';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

type SourceFilter = 'ALL' | QuizSourceType;

interface TeacherQuizRow extends Quiz {
    courseTitle: string;
    questionCount: number;
}

const FILTERS: SourceFilter[] = ['ALL', 'MANUAL', 'LESSON_AI', 'PDF_AI'];

const TeacherQuizLibraryPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, loading } = useAuth();
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

    const query = useQuery({
        queryKey: ['teacher-quiz-library', user?.id],
        enabled: Boolean(user?.id),
        queryFn: async () => {
            const teacherData = await dashboardService.getTeacherData();

            const rows = await Promise.all(
                teacherData.courses.map(async (course) => {
                    const quizzes = await quizService.getByCourse(course.id);
                    return quizzes.map((quiz) => ({
                        ...quiz,
                        courseTitle: course.title,
                        questionCount: (quiz._count?.questions ?? quiz.questions?.length ?? 0),
                    }));
                })
            );

            return rows.flat().sort((a, b) => {
                const left = new Date(a.createdAt).getTime();
                const right = new Date(b.createdAt).getTime();
                return right - left;
            });
        },
    });

    const filtered = useMemo(() => {
        const data = query.data || [];
        if (sourceFilter === 'ALL') return data;
        return data.filter((quiz) => quiz.sourceType === sourceFilter);
    }, [query.data, sourceFilter]);

    const deleteMutation = useMutation({
        mutationFn: (quizId: string) => quizService.remove(quizId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher-quiz-library'] });
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            setDeleteTarget(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to delete quiz.';
            window.alert(message);
        },
    });

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <p className="text-secondary">Loading...</p>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') return <Navigate to="/app/dashboard" replace />;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold font-headlines text-gray-900">Quiz Library</h1>
                <p className="text-secondary">Track all quizzes you created and review generated content anytime.</p>
            </div>

            <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-soft">
                <div className="flex items-center gap-2 text-sm font-semibold text-secondary mb-3">
                    <Filter size={15} />
                    Source Filter
                </div>
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setSourceFilter(filter)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${sourceFilter === filter
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-secondary hover:bg-gray-200'
                                }`}
                        >
                            {filter.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </section>

            {query.isLoading && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-secondary">
                    Loading quiz records...
                </div>
            )}

            {query.isError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Failed to fetch quiz records.
                </div>
            )}

            {!query.isLoading && filtered.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center space-y-3">
                    <ClipboardCheck size={36} className="mx-auto text-gray-300" />
                    <p className="font-semibold text-gray-900">No quizzes found for this filter.</p>
                    <Link
                        to="/app/courses"
                        className="text-sm font-bold uppercase tracking-widest text-primary hover:underline"
                    >
                        Go to courses
                    </Link>
                </div>
            )}

            <div className="space-y-3">
                {filtered.map((quiz: TeacherQuizRow) => (
                    <div
                        key={quiz.id}
                        className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-soft flex items-center justify-between gap-4"
                    >
                        <div className="space-y-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">{quiz.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-secondary">
                                <span className="inline-flex items-center gap-1">
                                    <BookOpen size={12} />
                                    {quiz.courseTitle}
                                </span>
                                <span>{quiz.questionCount} questions</span>
                                <span>{quiz.difficulty || 'MEDIUM'}</span>
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 font-semibold text-gray-700">
                                    {(quiz.sourceType || 'MANUAL').replace('_', ' ')}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <CalendarDays size={12} />
                                    {new Date(quiz.createdAt).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full font-semibold ${quiz.deadline ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {quiz.deadline ? `Deadline: ${new Date(quiz.deadline).toLocaleDateString()}` : 'No deadline'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate(`/app/quizzes/${quiz.id}/manage`)}
                                className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/15 transition-colors"
                            >
                                View Quiz
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget({ id: quiz.id, title: quiz.title })}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500/15 to-red-400/10 text-red-700 border border-red-200 font-bold text-xs uppercase tracking-widest hover:from-red-500/25 hover:to-red-400/20 transition-colors"
                            >
                                <span className="inline-flex items-center gap-1">
                                    <Trash2 size={13} />
                                    Delete
                                </span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={Boolean(deleteTarget)}
                onClose={() => {
                    if (!deleteMutation.isPending) {
                        setDeleteTarget(null);
                    }
                }}
                title="Delete Quiz"
                description="This action permanently deletes the quiz and all related attempts."
                footer={
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteTarget(null)}
                            disabled={deleteMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                                if (deleteTarget) {
                                    deleteMutation.mutate(deleteTarget.id);
                                }
                            }}
                            className="bg-gradient-to-r from-error/60 to-error/35 border-error/70 hover:from-error/70 hover:to-error/50"
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Quiz'}
                        </Button>
                    </div>
                }
            >
                <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3">
                    <p className="text-sm font-semibold text-error inline-flex items-center gap-2">
                        <AlertTriangle size={15} />
                        {deleteTarget ? `"${deleteTarget.title}" will be removed permanently.` : 'Selected quiz will be removed permanently.'}
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default TeacherQuizLibraryPage;
