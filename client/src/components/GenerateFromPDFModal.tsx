import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Loader2, Sparkles, X } from 'lucide-react';
import { materialService, type Material } from '../services/material.service';
import { quizService } from '../services/quiz.service';
import QuizPreviewEditor from './QuizPreviewEditor';
import type {
    EditableQuizQuestion,
    EditableQuizQuestionErrors,
    QuizOptionKey,
} from './QuizPreviewEditor';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface ApiErrorPayload {
    message?: string;
}

interface GenerateFromPDFModalProps {
    isOpen: boolean;
    material: Material | null;
    courseId: string;
    onClose: () => void;
    onSaved: (quizId: string) => void;
}

const createQuestionErrors = (count: number): EditableQuizQuestionErrors[] =>
    Array.from({ length: count }, () => ({}));

const GenerateFromPDFModal = ({
    isOpen,
    material,
    courseId,
    onClose,
    onSaved,
}: GenerateFromPDFModalProps) => {
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [questionCount, setQuestionCount] = useState(5);
    const [quizTitle, setQuizTitle] = useState('');
    const [questions, setQuestions] = useState<EditableQuizQuestion[]>([]);
    const [errors, setErrors] = useState<EditableQuizQuestionErrors[]>([]);
    const [generateError, setGenerateError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isOpen || !material) return;
        setQuizTitle(`${material.title} - PDF Quiz`);
        setQuestions([]);
        setErrors([]);
        setGenerateError('');
        setSaveError('');
        setProgress(0);
    }, [isOpen, material]);

    const generateMutation = useMutation({
        mutationFn: () => {
            if (!material) throw new Error('Material not selected');
            return materialService.generateQuizFromPdf(material.id, {
                difficulty,
                questionCount,
            });
        },
        onSuccess: (quiz) => {
            setProgress(100);
            setGenerateError('');
            const mapped: EditableQuizQuestion[] = (quiz.questions || []).map((question, index) => {
                const options = question.options as Record<string, string>;
                return {
                    id: question.id || `generated-${index}`,
                    question: question.question || '',
                    options: {
                        A: options.A || '',
                        B: options.B || '',
                        C: options.C || '',
                        D: options.D || '',
                    },
                    correctOption: (question.correctOption || '') as QuizOptionKey | '',
                    explanation: question.explanation || '',
                    marks: question.marks || 1,
                };
            });
            setQuestions(mapped);
            setErrors(createQuestionErrors(mapped.length));
        },
        onError: (error) => {
            setProgress(0);
            const axiosError = error as AxiosError<ApiErrorPayload>;
            const message = axiosError.response?.data?.message || 'AI generation failed. Please try again.';
            const timeout = axiosError.code === 'ECONNABORTED' || message.toLowerCase().includes('timeout');
            const noText = message.toLowerCase().includes('short') || message.toLowerCase().includes('extract');
            if (timeout) {
                setGenerateError('Generation timed out. Large PDFs may take longer; try again or reduce question count.');
                return;
            }
            if (noText) {
                setGenerateError('No extractable text found in this PDF. Upload a text-based PDF and try again.');
                return;
            }
            setGenerateError(message);
        },
    });

    useEffect(() => {
        if (!generateMutation.isPending) return;
        setProgress(8);
        const timer = setInterval(() => {
            setProgress((prev) => Math.min(prev + 7, 88));
        }, 450);
        return () => clearInterval(timer);
    }, [generateMutation.isPending]);

    const saveMutation = useMutation({
        mutationFn: () =>
            quizService.create({
                title: quizTitle.trim(),
                courseId,
                difficulty,
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
                    marks: question.marks,
                })),
            }),
        onSuccess: (quiz) => {
            onClose();
            onSaved(quiz.id);
        },
        onError: (error) => {
            const axiosError = error as AxiosError<ApiErrorPayload>;
            const message = axiosError.response?.data?.message || 'Failed to save quiz.';
            const timeout = axiosError.code === 'ECONNABORTED' || message.toLowerCase().includes('timeout');
            if (timeout) {
                setSaveError('Save request timed out. Please retry.');
                return;
            }
            setSaveError(message);
        },
    });

    const hasPreview = useMemo(() => questions.length > 0, [questions.length]);
    const isBusy = generateMutation.isPending || saveMutation.isPending;

    const validateBeforeSave = (): boolean => {
        const nextErrors = createQuestionErrors(questions.length);
        let hasError = false;

        if (!quizTitle.trim()) {
            setSaveError('Quiz title is required.');
            hasError = true;
        }

        if (questions.length === 0) {
            setSaveError('At least one question is required.');
            hasError = true;
        }

        questions.forEach((question, index) => {
            if (!question.question.trim()) {
                nextErrors[index].question = 'Question text is required.';
                hasError = true;
            }

            const optionCount = (['A', 'B', 'C', 'D'] as QuizOptionKey[]).filter(
                (key) => question.options[key].trim().length > 0
            ).length;
            if (optionCount !== 4) {
                nextErrors[index].options = 'Exactly 4 options are required.';
                hasError = true;
            }

            if (!question.correctOption) {
                nextErrors[index].correctOption = 'Choose one correct answer.';
                hasError = true;
            }
        });

        setErrors(nextErrors);
        if (!hasError) setSaveError('');
        return !hasError;
    };

    if (!isOpen || !material) return null;

    return (
        <div className="fixed inset-0 z-[120] bg-gray-900/60 backdrop-blur-sm p-4 flex items-center justify-center modal-fade-overlay">
            <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-background-soft border border-white/30 shadow-2xl modal-fade-panel">
                <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Sparkles size={20} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-headlines text-gray-900">Generate Quiz from PDF</h3>
                            <p className="text-xs text-secondary">{material.title}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isBusy}
                        className="p-2 rounded-xl text-secondary hover:bg-gray-100 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-84px)]">
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-700">
                        Large PDFs can take longer to process and may timeout. For best results, upload text-based PDFs under 10MB.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-2">Difficulty</label>
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
                            <label className="text-sm font-semibold text-gray-700 block mb-2">Questions</label>
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
                                    setSaveError('');
                                    generateMutation.mutate();
                                }}
                                disabled={generateMutation.isPending}
                                className="w-full btn-gradient py-3.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            >
                                {generateMutation.isPending ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate'
                                )}
                            </button>
                        </div>
                    </div>

                    {generateMutation.isPending && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-secondary">
                                <span>Generating quiz</span>
                                <span>{progress}%</span>
                            </div>
                            <progress className="progress-base w-full h-2" value={progress} max={100} />
                        </div>
                    )}

                    {generateError && (
                        <div className="notification-slide-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {generateError}
                        </div>
                    )}

                    {hasPreview && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Quiz Title</label>
                                <input
                                    value={quizTitle}
                                    onChange={(event) => setQuizTitle(event.target.value)}
                                    disabled={isBusy}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus-glow disabled:bg-gray-50"
                                />
                            </div>

                            <QuizPreviewEditor
                                questions={questions}
                                errors={errors}
                                disabled={isBusy}
                                onUpdate={(index, next) => {
                                    setQuestions((prev) => prev.map((q, i) => (i === index ? next : q)));
                                }}
                                onDelete={(index) => {
                                    setQuestions((prev) => prev.filter((_, i) => i !== index));
                                    setErrors((prev) => prev.filter((_, i) => i !== index));
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

export default GenerateFromPDFModal;
