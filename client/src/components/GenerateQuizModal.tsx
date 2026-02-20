import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Loader2, Sparkles, X } from 'lucide-react';
import QuizPreview from './QuizPreview';
import type {
    EditableQuizQuestion,
    EditableQuizQuestionErrors,
    EditableOptionKey,
} from './QuizPreview';
import { lessonService } from '../services/lesson.service';
import { quizService } from '../services/quiz.service';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface ApiErrorResponse {
    message?: string;
    errors?: Array<{ field?: string; message: string }>;
}

interface GenerateQuizModalProps {
    isOpen: boolean;
    lessonId: string;
    courseId: string;
    lessonTitle: string;
    hasLessonContent: boolean;
    onClose: () => void;
    onSaved: (quizId: string) => void;
}

const defaultQuestionErrors = (count: number): EditableQuizQuestionErrors[] => Array.from({ length: count }, () => ({}));

const GenerateQuizModal = ({
    isOpen,
    lessonId,
    courseId,
    lessonTitle,
    hasLessonContent,
    onClose,
    onSaved,
}: GenerateQuizModalProps) => {
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [questionCount, setQuestionCount] = useState(5);
    const [quizTitle, setQuizTitle] = useState(`${lessonTitle} - AI Quiz`);
    const [questions, setQuestions] = useState<EditableQuizQuestion[]>([]);
    const [questionErrors, setQuestionErrors] = useState<EditableQuizQuestionErrors[]>([]);
    const [generateError, setGenerateError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setQuizTitle(`${lessonTitle} - AI Quiz`);
            setGenerateError('');
            setSaveError('');
            setSuccessMessage('');
        }
    }, [isOpen, lessonTitle]);

    const generateMutation = useMutation({
        mutationFn: () =>
            lessonService.generateQuizFromLesson(lessonId, {
                difficulty,
                questionCount,
            }),
        onSuccess: (generatedQuiz) => {
            setGenerateError('');
            setSaveError('');
            setSuccessMessage('Quiz generated successfully. Review, edit, and save.');
            setQuizTitle(generatedQuiz.title || `${lessonTitle} - AI Quiz`);
            const mapped = (generatedQuiz.questions || []).map((question, index) => {
                const options = question.options as Record<string, string>;
                const normalize = (key: EditableOptionKey) => options[key] || '';
                const correct = (question.correctOption || '') as EditableOptionKey | '';
                return {
                    id: question.id || `generated-${index}`,
                    question: question.question || '',
                    options: {
                        A: normalize('A'),
                        B: normalize('B'),
                        C: normalize('C'),
                        D: normalize('D'),
                    },
                    correctOption: correct,
                    explanation: question.explanation || '',
                    marks: question.marks || 1,
                };
            });
            setQuestions(mapped);
            setQuestionErrors(defaultQuestionErrors(mapped.length));
        },
        onError: (error) => {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            const code = axiosError.code || '';
            const message = axiosError.response?.data?.message || 'Failed to generate quiz.';

            if (code === 'ECONNABORTED' || message.toLowerCase().includes('timeout')) {
                setGenerateError('Generation timed out. Try again with fewer questions or retry.');
                return;
            }
            setGenerateError(message);
        },
    });

    const saveMutation = useMutation({
        mutationFn: () =>
            quizService.create({
                title: quizTitle.trim(),
                courseId,
                lessonId,
                difficulty,
                questions: questions.map((question) => ({
                    question: question.question.trim(),
                    options: {
                        A: question.options.A.trim(),
                        B: question.options.B.trim(),
                        C: question.options.C.trim(),
                        D: question.options.D.trim(),
                    },
                    correctOption: question.correctOption as EditableOptionKey,
                    explanation: question.explanation.trim() || undefined,
                    marks: question.marks || 1,
                })),
            }),
        onSuccess: (quiz) => {
            onClose();
            onSaved(quiz.id);
        },
        onError: (error) => {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            const code = axiosError.code || '';
            const message = axiosError.response?.data?.message || 'Failed to save quiz.';

            if (code === 'ECONNABORTED' || message.toLowerCase().includes('timeout')) {
                setSaveError('Save request timed out. Please retry.');
                return;
            }
            setSaveError(message);
        },
    });

    const validateBeforeSave = (): boolean => {
        const nextErrors = defaultQuestionErrors(questions.length);
        let hasError = false;

        if (!quizTitle.trim()) {
            setSaveError('Quiz title is required.');
            hasError = true;
        }

        if (questions.length === 0) {
            setSaveError('At least 1 question is required before saving.');
            hasError = true;
        }

        questions.forEach((question, index) => {
            if (!question.question.trim()) {
                nextErrors[index].question = 'Question text is required.';
                hasError = true;
            }

            const optionValues = ['A', 'B', 'C', 'D'].map((key) => question.options[key as EditableOptionKey]?.trim() || '');
            if (optionValues.filter(Boolean).length !== 4) {
                nextErrors[index].options = 'Exactly 4 options are required.';
                hasError = true;
            }

            if (!question.correctOption) {
                nextErrors[index].correctOption = 'Please select one correct answer.';
                hasError = true;
            }
        });

        setQuestionErrors(nextErrors);
        if (!hasError) {
            setSaveError('');
        }
        return !hasError;
    };

    const isBusy = generateMutation.isPending || saveMutation.isPending;
    const canGenerate = hasLessonContent && !generateMutation.isPending;
    const hasPreview = useMemo(() => questions.length > 0, [questions.length]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm modal-fade-overlay">
            <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-background-soft border border-white/30 shadow-2xl modal-fade-panel">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Sparkles className="text-primary" size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 font-headlines">Generate Quiz</h3>
                            <p className="text-xs text-secondary">AI-powered quiz from lesson content</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isBusy}
                        className="p-2 rounded-xl text-secondary hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-84px)]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                            <select
                                value={difficulty}
                                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                                disabled={isBusy}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus-glow disabled:bg-gray-50"
                            >
                                <option value="EASY">EASY</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HARD">HARD</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Questions</label>
                            <select
                                value={questionCount}
                                onChange={(event) => setQuestionCount(Number(event.target.value))}
                                disabled={isBusy}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus-glow disabled:bg-gray-50"
                            >
                                {[5, 6, 7, 8, 9, 10].map((count) => (
                                    <option key={count} value={count}>
                                        {count}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setGenerateError('');
                                    setSuccessMessage('');
                                    generateMutation.mutate();
                                }}
                                disabled={!canGenerate}
                                className="w-full btn-gradient py-3.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            >
                                {generateMutation.isPending ? (
                                    <>
                                        <Loader2 size={17} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate'
                                )}
                            </button>
                        </div>
                    </div>

                    {!hasLessonContent && (
                        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                            Lesson content is empty. Add lesson content before generating quiz questions.
                        </div>
                    )}

                    {generateError && (
                        <div className="notification-slide-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {generateError}
                        </div>
                    )}

                    {successMessage && (
                        <div className="notification-slide-in rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {successMessage}
                        </div>
                    )}

                    {hasPreview && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Quiz title</label>
                                <input
                                    value={quizTitle}
                                    onChange={(event) => setQuizTitle(event.target.value)}
                                    disabled={isBusy}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus-glow disabled:bg-gray-50"
                                />
                            </div>

                            <QuizPreview
                                questions={questions}
                                errors={questionErrors}
                                disabled={isBusy}
                                onChange={(index, next) => {
                                    setQuestions((prev) => prev.map((question, qIndex) => (qIndex === index ? next : question)));
                                }}
                                onDelete={(index) => {
                                    setQuestions((prev) => prev.filter((_, qIndex) => qIndex !== index));
                                    setQuestionErrors((prev) => prev.filter((_, qIndex) => qIndex !== index));
                                }}
                            />

                            {saveError && <p className="notification-slide-in text-sm text-red-600">{saveError}</p>}

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (validateBeforeSave()) {
                                            saveMutation.mutate();
                                        }
                                    }}
                                    disabled={saveMutation.isPending}
                                    className="btn-gradient px-8 py-3.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                                >
                                    {saveMutation.isPending ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Quiz'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GenerateQuizModal;
