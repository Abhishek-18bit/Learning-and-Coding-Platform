import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { CheckCircle2, ChevronLeft, Loader2, Plus } from 'lucide-react';
import QuestionBuilder from '../components/QuestionBuilder';
import type {
    QuizBuilderQuestion,
    QuizBuilderQuestionErrors,
    QuizOptionKey,
} from '../components/QuestionBuilder';
import { useAuth } from '../contexts/AuthContext';
import { lessonService } from '../services/lesson.service';
import { quizService } from '../services/quiz.service';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface ApiValidationError {
    field?: string;
    message: string;
}

interface FormErrors {
    title?: string;
    questions?: string;
    deadline?: string;
}

const createEmptyQuestion = (): QuizBuilderQuestion => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    question: '',
    options: {
        A: '',
        B: '',
        C: '',
        D: '',
    },
    correctOption: '',
    explanation: '',
});

const QuizBuilderPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { courseId } = useParams<{ courseId: string }>();
    const { user, loading: authLoading } = useAuth();

    const [title, setTitle] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [lessonId, setLessonId] = useState('');
    const [deadlineLocal, setDeadlineLocal] = useState('');
    const [questions, setQuestions] = useState<QuizBuilderQuestion[]>([createEmptyQuestion()]);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [questionErrors, setQuestionErrors] = useState<QuizBuilderQuestionErrors[]>([]);
    const [apiError, setApiError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [createdQuizId, setCreatedQuizId] = useState('');

    const isTeacher = user?.role === 'TEACHER';

    const lessonsQuery = useQuery({
        queryKey: ['course-lessons', courseId],
        queryFn: () => lessonService.getByCourseId(courseId!),
        enabled: Boolean(courseId && isTeacher),
    });

    const createQuizMutation = useMutation({
        mutationFn: () =>
            quizService.create({
                title: title.trim(),
                courseId: courseId!,
                lessonId: lessonId || undefined,
                difficulty,
                deadline: deadlineLocal ? new Date(deadlineLocal).toISOString() : undefined,
                questions: questions.map((question) => ({
                    question: question.question.trim(),
                    options: {
                        A: question.options.A.trim(),
                        B: question.options.B.trim(),
                        C: question.options.C.trim(),
                        D: question.options.D.trim(),
                    },
                    correctOption: question.correctOption as QuizOptionKey,
                    explanation: question.explanation.trim() || undefined,
                    marks: 1,
                })),
            }),
        onSuccess: (quiz) => {
            setSuccessMessage('Quiz created successfully.');
            setApiError('');
            setCreatedQuizId(quiz.id);
            queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        },
        onError: (error) => {
            const axiosError = error as AxiosError<{ message?: string; errors?: ApiValidationError[] }>;
            const payload = axiosError.response?.data;
            const message = payload?.message || 'Failed to create quiz. Please try again.';
            setApiError(message);

            if (payload?.errors?.length) {
                applyBackendErrors(payload.errors);
            }
        },
    });

    const canSubmit = useMemo(() => !createQuizMutation.isPending, [createQuizMutation.isPending]);

    const applyBackendErrors = (errors: ApiValidationError[]) => {
        const nextFormErrors: FormErrors = {};
        const nextQuestionErrors: QuizBuilderQuestionErrors[] = questions.map(() => ({}));

        errors.forEach((entry) => {
            const field = entry.field || '';
            if (field === 'title') {
                nextFormErrors.title = entry.message;
                return;
            }

            if (field.startsWith('questions.')) {
                const parts = field.split('.');
                const index = Number(parts[1]);
                const key = parts[2];
                if (Number.isNaN(index) || !nextQuestionErrors[index]) {
                    return;
                }

                if (key === 'question') nextQuestionErrors[index].question = entry.message;
                if (key === 'options') nextQuestionErrors[index].options = entry.message;
                if (key === 'correctOption') nextQuestionErrors[index].correctOption = entry.message;
            }
        });

        setFormErrors((prev) => ({ ...prev, ...nextFormErrors }));
        setQuestionErrors(nextQuestionErrors);
    };

    const validateForm = (): boolean => {
        const nextFormErrors: FormErrors = {};
        const nextQuestionErrors: QuizBuilderQuestionErrors[] = questions.map(() => ({}));

        if (!title.trim()) {
            nextFormErrors.title = 'Quiz title is required.';
        }

        if (!questions.length) {
            nextFormErrors.questions = 'At least 1 question is required.';
        }

        if (deadlineLocal) {
            const parsed = new Date(deadlineLocal);
            if (Number.isNaN(parsed.getTime())) {
                nextFormErrors.deadline = 'Deadline must be a valid date and time.';
            } else if (parsed.getTime() <= Date.now()) {
                nextFormErrors.deadline = 'Deadline must be in the future.';
            }
        }

        questions.forEach((question, index) => {
            if (!question.question.trim()) {
                nextQuestionErrors[index].question = 'Question text is required.';
            }

            const optionKeys: QuizOptionKey[] = ['A', 'B', 'C', 'D'];
            const filled = optionKeys.filter((key) => question.options[key].trim()).length;
            if (filled !== 4) {
                nextQuestionErrors[index].options = 'Exactly 4 options are required.';
            }

            if (!question.correctOption) {
                nextQuestionErrors[index].correctOption = 'Select one correct answer.';
            }
        });

        setFormErrors(nextFormErrors);
        setQuestionErrors(nextQuestionErrors);

        const hasFormError = Object.keys(nextFormErrors).length > 0;
        const hasQuestionError = nextQuestionErrors.some((item) => Object.keys(item).length > 0);
        return !hasFormError && !hasQuestionError;
    };

    const updateQuestion = (index: number, nextQuestion: QuizBuilderQuestion) => {
        setQuestions((current) => current.map((question, qIndex) => (qIndex === index ? nextQuestion : question)));
    };

    const addQuestion = () => {
        setQuestions((current) => [...current, createEmptyQuestion()]);
        setSuccessMessage('');
    };

    const removeQuestion = (index: number) => {
        setQuestions((current) => current.filter((_, qIndex) => qIndex !== index));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setApiError('');
        setSuccessMessage('');
        setCreatedQuizId('');

        if (!courseId) {
            setApiError('Course context is missing. Open this page from a course.');
            return;
        }

        if (!validateForm()) {
            return;
        }

        createQuizMutation.mutate();
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="animate-spin text-primary" size={28} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!isTeacher) {
        return <Navigate to="/app/dashboard" replace />;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white rounded-xl border border-gray-100 shadow-soft hover:bg-gray-50 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold font-headlines text-gray-900">Quiz Builder</h1>
                    <p className="text-secondary mt-1">Create and publish a quiz with structured MCQ questions.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                    <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Quiz Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="e.g. Mid Term Concept Quiz"
                                disabled={createQuizMutation.isPending}
                            />
                            {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                                <select
                                    value={difficulty}
                                    onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50"
                                    disabled={createQuizMutation.isPending}
                                >
                                    <option value="EASY">EASY</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="HARD">HARD</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Lesson (Optional)</label>
                                <select
                                    value={lessonId}
                                    onChange={(event) => setLessonId(event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50 disabled:bg-gray-100"
                                    disabled={createQuizMutation.isPending || lessonsQuery.isLoading}
                                >
                                    <option value="">All Course Lessons</option>
                                    {(lessonsQuery.data || []).map((lesson) => (
                                        <option key={lesson.id} value={lesson.id}>
                                            {lesson.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={deadlineLocal}
                                    onChange={(event) => setDeadlineLocal(event.target.value)}
                                    min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50 disabled:bg-gray-100"
                                    disabled={createQuizMutation.isPending}
                                />
                                {formErrors.deadline && <p className="text-xs text-red-600 mt-1">{formErrors.deadline}</p>}
                            </div>
                        </div>
                    </section>

                    <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Questions</h2>
                            <button
                                type="button"
                                onClick={addQuestion}
                                disabled={createQuizMutation.isPending}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/15 transition-all disabled:opacity-50"
                            >
                                <Plus size={16} />
                                Add Question
                            </button>
                        </div>

                        {formErrors.questions && <p className="text-sm text-red-600">{formErrors.questions}</p>}

                        <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
                            {questions.map((question, index) => (
                                <QuestionBuilder
                                    key={question.id}
                                    index={index}
                                    question={question}
                                    errors={questionErrors[index]}
                                    canRemove={questions.length > 1}
                                    disabled={createQuizMutation.isPending}
                                    onChange={(next) => updateQuestion(index, next)}
                                    onRemove={() => removeQuestion(index)}
                                />
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="space-y-4">
                    <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-soft space-y-3">
                        <h3 className="text-lg font-bold text-gray-900">Publish Quiz</h3>
                        <p className="text-sm text-secondary">
                            Review all questions before publishing. Students will see this quiz in the course assessment list.
                        </p>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-full btn-gradient py-3.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            {createQuizMutation.isPending ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Quiz'
                            )}
                        </button>
                    </section>

                    {apiError && (
                        <section className="bg-red-50 border border-red-100 rounded-xl p-4">
                            <p className="text-sm text-red-700">{apiError}</p>
                        </section>
                    )}

                    {successMessage && (
                        <section className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="text-emerald-600 mt-0.5" size={18} />
                                <p className="text-sm text-emerald-700 font-semibold">{successMessage}</p>
                            </div>
                            {createdQuizId && (
                                <Link to={`/app/quizzes/${createdQuizId}/manage`} className="block text-sm text-emerald-700 underline">
                                    View quiz record
                                </Link>
                            )}
                            <Link to={`/app/course/${courseId}`} className="text-sm text-emerald-700 underline">
                                Back to course
                            </Link>
                        </section>
                    )}
                </aside>
            </form>
        </div>
    );
};

export default QuizBuilderPage;
