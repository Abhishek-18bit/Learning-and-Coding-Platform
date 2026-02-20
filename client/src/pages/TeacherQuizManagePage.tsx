import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { quizService } from '../services/quiz.service';

const TeacherQuizManagePage = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, loading } = useAuth();

    const query = useQuery({
        queryKey: ['quiz-manage', quizId],
        queryFn: () => quizService.getById(quizId!),
        enabled: Boolean(quizId),
    });

    const deleteMutation = useMutation({
        mutationFn: () => quizService.remove(quizId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher-quiz-library'] });
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            navigate('/app/quizzes/manage');
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

    if (query.isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 size={30} className="animate-spin text-primary" />
                <p className="text-secondary">Loading quiz details...</p>
            </div>
        );
    }

    if (query.isError || !query.data) {
        return (
            <div className="max-w-3xl mx-auto rounded-2xl border border-red-100 bg-red-50 p-6 space-y-3">
                <p className="text-red-700 font-semibold">Failed to load this quiz.</p>
                <button
                    onClick={() => navigate('/app/quizzes/manage')}
                    className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
                >
                    Back to Quiz Library
                </button>
            </div>
        );
    }

    const quiz = query.data;
    const questions = quiz.questions || [];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate('/app/quizzes/manage')}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:underline"
                    >
                        <ArrowLeft size={14} />
                        Back to Quiz Library
                    </button>
                    <h1 className="text-3xl font-bold font-headlines text-gray-900">{quiz.title}</h1>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                            {(quiz.sourceType || 'MANUAL').replace('_', ' ')}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                            {quiz.difficulty || 'MEDIUM'}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold inline-flex items-center gap-1">
                            <Clock size={12} />
                            {quiz.timeLimit} mins
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => navigate(`/app/quiz/${quiz.id}`)}
                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/15 transition-colors"
                >
                    Open Attempt View
                </button>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => {
                        const confirmed = window.confirm('Delete this quiz? This action cannot be undone.');
                        if (confirmed) {
                            deleteMutation.mutate();
                        }
                    }}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-red-50 text-red-700 font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Quiz'}
                </button>
            </div>

            <div className="space-y-4">
                {questions.map((question, index) => {
                    const options = question.options as Record<string, string>;
                    return (
                        <section key={question.id || index} className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 space-y-4">
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-widest text-primary">Question {index + 1}</p>
                                <h3 className="font-bold text-gray-900">{question.question}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(options).map(([key, value]) => {
                                    const isCorrect = key === question.correctOption;
                                    return (
                                        <div
                                            key={key}
                                            className={`rounded-xl border px-4 py-3 text-sm ${isCorrect
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                                : 'border-gray-200 bg-gray-50 text-gray-800'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold">{key}. {value}</span>
                                                {isCorrect && <CheckCircle2 size={16} className="text-emerald-600" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-1">Explanation</p>
                                <p className="text-sm text-blue-900">{question.explanation || 'No explanation provided.'}</p>
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
};

export default TeacherQuizManagePage;
