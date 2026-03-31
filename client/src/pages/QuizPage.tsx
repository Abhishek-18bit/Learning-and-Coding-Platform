import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, Loader2, Timer } from 'lucide-react';
import axios from 'axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { quizService } from '../services/quiz.service';
import { useAuth } from '../contexts/AuthContext';
import ContextChatPanel from '../components/chat/ContextChatPanel';

const QuizPage = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isStudent = user?.role === 'STUDENT';

    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isTimerReady, setIsTimerReady] = useState(false);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [isStartingAttempt, setIsStartingAttempt] = useState(false);
    const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false);
    const [attemptError, setAttemptError] = useState<string | null>(null);
    const [finalScore, setFinalScore] = useState<number | null>(null);
    const startRequestedRef = useRef(false);

    const { data: quiz, isLoading, isError } = useQuery({
        queryKey: ['quiz', quizId],
        queryFn: () => quizService.getById(quizId!),
        enabled: Boolean(quizId),
    });

    useEffect(() => {
        if (!quiz) return;

        const questionCount = quiz.questions?.length || 0;
        const safeTimeLimitMinutes =
            typeof quiz.timeLimit === 'number' && quiz.timeLimit > 0
                ? quiz.timeLimit
                : Math.max(5, questionCount * 2);

        setTimeLeft(safeTimeLimitMinutes * 60);
        setIsTimerReady(questionCount > 0);
    }, [quiz]);

    useEffect(() => {
        if (!isStudent || !quiz?.id || attemptId || startRequestedRef.current) return;
        if (quiz.deadline && new Date(quiz.deadline).getTime() <= Date.now()) return;

        startRequestedRef.current = true;
        setIsStartingAttempt(true);
        setAttemptError(null);

        quizService
            .startAttempt(quiz.id)
            .then((attempt) => {
                setAttemptId(attempt.id);
            })
            .catch((error: unknown) => {
                startRequestedRef.current = false;
                if (axios.isAxiosError(error)) {
                    setAttemptError(error.response?.data?.message || 'Failed to start quiz attempt.');
                } else {
                    setAttemptError('Failed to start quiz attempt.');
                }
            })
            .finally(() => setIsStartingAttempt(false));
    }, [isStudent, quiz?.id, quiz?.deadline, attemptId]);

    useEffect(() => {
        if (!isTimerReady || isFinished || isSubmittingAttempt) return;

        if (timeLeft > 0) {
            const timer = window.setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
            return () => window.clearInterval(timer);
        }
        if (timeLeft === 0 && quiz) {
            void handleFinish();
        }
        return undefined;
    }, [timeLeft, isFinished, quiz, isTimerReady, isSubmittingAttempt]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (option: string) => {
        if (!quiz) return;
        const questionId = quiz.questions?.[currentQuestionIdx].id;
        if (questionId) {
            setAnswers((prev) => ({ ...prev, [questionId]: option }));
        }
    };

    const calculateScore = () => {
        if (!quiz?.questions) return 0;
        return quiz.questions.reduce((sum, question) => {
            const selected = answers[question.id];
            if (selected && selected === question.correctOption) {
                return sum + (question.marks || 1);
            }
            return sum;
        }, 0);
    };

    const handleFinish = async () => {
        if (isSubmittingAttempt || isFinished || !quiz) return;

        if (!isStudent) {
            setIsFinished(true);
            return;
        }

        setIsSubmittingAttempt(true);
        setAttemptError(null);

        try {
            let activeAttemptId = attemptId;
            if (!activeAttemptId) {
                const startedAttempt = await quizService.startAttempt(quiz.id);
                activeAttemptId = startedAttempt.id;
                setAttemptId(startedAttempt.id);
            }

            const score = calculateScore();
            await quizService.submitAttempt(activeAttemptId, score);
            setFinalScore(score);
            setIsFinished(true);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setAttemptError(error.response?.data?.message || 'Failed to submit quiz attempt.');
            } else {
                setAttemptError('Failed to submit quiz attempt.');
            }
        } finally {
            setIsSubmittingAttempt(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="typ-muted font-medium">Downloading assessment content...</p>
            </div>
        );
    }

    if (isError || !quiz) {
        return (
            <Card variant="layered" className="p-16 text-center space-y-4 max-w-2xl mx-auto mt-10">
                <AlertCircle size={56} className="mx-auto text-error/35" />
                <h2 className="typ-h2 !text-2xl mb-0">Quiz Not Found</h2>
                <p className="typ-muted">We could not retrieve this quiz right now.</p>
                <div className="flex justify-center">
                    <Button variant="primary" onClick={() => navigate('/app/quizzes')}>
                        View All Quizzes
                    </Button>
                </div>
            </Card>
        );
    }

    const questions = quiz.questions || [];
    const isDeadlinePassed = Boolean(quiz.deadline && new Date(quiz.deadline).getTime() <= Date.now());
    const currentQuestion = questions[currentQuestionIdx];
    const answeredCount = Object.keys(answers).length;
    const completionPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

    if (questions.length === 0) {
        return (
            <Card variant="layered" className="p-16 text-center space-y-4 max-w-2xl mx-auto mt-10">
                <AlertCircle size={56} className="mx-auto text-error/35" />
                <h2 className="typ-h2 !text-2xl mb-0">Quiz Unavailable</h2>
                <p className="typ-muted">This quiz has no questions yet.</p>
                <div className="flex justify-center">
                    <Button variant="primary" onClick={() => navigate('/app/quizzes')}>
                        Back to Quizzes
                    </Button>
                </div>
            </Card>
        );
    }

    if (isStudent && isDeadlinePassed) {
        return (
            <Card variant="layered" className="p-16 text-center space-y-4 max-w-2xl mx-auto mt-10">
                <AlertCircle size={56} className="mx-auto text-error/35" />
                <h2 className="typ-h2 !text-2xl mb-0">Quiz Deadline Passed</h2>
                <p className="typ-muted">
                    This quiz closed on {quiz.deadline ? new Date(quiz.deadline).toLocaleString() : 'its deadline'}.
                </p>
                <div className="flex justify-center">
                    <Button variant="primary" onClick={() => navigate('/app/quizzes')}>
                        Back to Quizzes
                    </Button>
                </div>
            </Card>
        );
    }

    if (isFinished) {
        return (
            <div className="h-full flex items-center justify-center">
                <section className="mission-shell w-full max-w-2xl p-8 text-center">
                    <div className="mission-shell-content space-y-6">
                        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-success/45 bg-success/20 text-success">
                            <CheckCircle2 size={42} />
                        </div>
                        <div>
                            <h2 className="mission-title">Quiz Completed</h2>
                            <p className="mission-subtitle">Your answers were submitted successfully.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                            <div className="mission-metric">
                                <span className="mission-metric-label">Questions</span>
                                <span className="mission-metric-value">{questions.length}</span>
                            </div>
                            <div className="mission-metric">
                                <span className="mission-metric-label">Answered</span>
                                <span className="mission-metric-value">{answeredCount}</span>
                            </div>
                            {isStudent && finalScore !== null ? (
                                <div className="mission-metric col-span-2 md:col-span-1">
                                    <span className="mission-metric-label">Score</span>
                                    <span className="mission-metric-value">{finalScore}/{quiz.totalMarks}</span>
                                </div>
                            ) : null}
                        </div>
                        <Button variant="primary" fullWidth onClick={() => navigate('/app/quizzes')}>
                            Back to Quiz List
                        </Button>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="mission-page pb-8">
            <section className="mission-shell p-6">
                <div className="mission-shell-content flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <span className="mission-kicker">
                            <span className="mission-kicker-dot" />
                            Active Quiz Attempt
                        </span>
                        <h1 className="mission-title mt-3">{quiz.title}</h1>
                        <p className="mission-subtitle">Question {currentQuestionIdx + 1} of {questions.length}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mission-chip">
                            <ClipboardCheck size={13} />
                            {answeredCount}/{questions.length} answered
                        </span>
                        <span className={`mission-chip ${timeLeft < 60 ? '!border-error/50 !bg-error/20 !text-error animate-pulse' : ''}`}>
                            <Timer size={13} />
                            {formatTime(timeLeft)}
                        </span>
                        {quiz.deadline ? (
                            <span className="mission-chip">
                                <CalendarDays size={13} />
                                Due {new Date(quiz.deadline).toLocaleDateString()}
                            </span>
                        ) : null}
                    </div>
                </div>
            </section>

            {attemptError ? (
                <Card variant="layered" className="border border-error/35 bg-error/12 px-4 py-3 text-sm text-error">
                    {attemptError}
                </Card>
            ) : null}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.32fr_0.68fr]">
                <Card variant="layered" className="space-y-5">
                    <div className="space-y-3">
                        <p className="mission-panel-title">Current Question</p>
                        <h2 className="typ-h2 !text-3xl leading-tight mb-0">{currentQuestion?.question}</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {Object.entries(currentQuestion?.options || {}).map(([key, value]) => {
                            const selected = answers[currentQuestion.id] === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleAnswer(key)}
                                    className={`rounded-xl border px-4 py-4 text-left transition dur-fast ${
                                        selected
                                            ? 'border-primary-blue/55 bg-primary-blue/15'
                                            : 'border-border bg-card/70 hover:border-primary-blue/35 hover:bg-surface'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span
                                            className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${
                                                selected ? 'bg-primary-blue text-white' : 'bg-surface text-gray-700'
                                            }`}
                                        >
                                            {key}
                                        </span>
                                        <span className={`text-sm leading-6 ${selected ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {value}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                        <Button
                            variant="ghost"
                            className="border border-border"
                            disabled={currentQuestionIdx === 0}
                            onClick={() => setCurrentQuestionIdx((idx) => idx - 1)}
                        >
                            Previous
                        </Button>

                        {currentQuestionIdx === questions.length - 1 ? (
                            <Button
                                variant="primary"
                                onClick={() => {
                                    void handleFinish();
                                }}
                                disabled={isStartingAttempt || isSubmittingAttempt}
                            >
                                {isSubmittingAttempt
                                    ? 'Submitting...'
                                    : isStartingAttempt
                                      ? 'Starting Attempt...'
                                      : 'Submit All Answers'}
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={() => setCurrentQuestionIdx((idx) => idx + 1)}
                            >
                                Next Question
                                <ChevronRight size={16} />
                            </Button>
                        )}
                    </div>
                </Card>

                <div className="space-y-5">
                    <Card variant="glass" className="space-y-4">
                        <div>
                            <p className="mission-panel-title">Progress</p>
                            <h3 className="typ-h3 !text-xl mb-1 mt-2">Attempt status</h3>
                            <p className="typ-muted">Answer all questions before submission.</p>
                        </div>
                        <ProgressBar value={completionPercent} showLabel />
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="primary">Q {currentQuestionIdx + 1}</Badge>
                            <Badge variant="success">{answeredCount} answered</Badge>
                            <Badge variant="muted">{questions.length - answeredCount} remaining</Badge>
                        </div>
                    </Card>

                    <Card variant="layered" className="space-y-3">
                        <h3 className="typ-h3 !mb-0 !text-lg">Question Navigator</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((question, idx) => {
                                const isActive = idx === currentQuestionIdx;
                                const isAnswered = Boolean(answers[question.id]);

                                return (
                                    <button
                                        key={question.id}
                                        type="button"
                                        onClick={() => setCurrentQuestionIdx(idx)}
                                        className={`rounded-lg border py-2 text-xs font-semibold transition dur-fast ${
                                            isActive
                                                ? 'border-primary-blue/55 bg-primary-blue/20 text-primary-cyan'
                                                : isAnswered
                                                  ? 'border-success/45 bg-success/12 text-success'
                                                  : 'border-border bg-card/70 text-muted hover:text-gray-700'
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>

            <ContextChatPanel
                contextType="QUIZ"
                contextId={quiz.id}
                title="Quiz Discussion"
                subtitle="Clarifications and post-quiz discussion."
            />
        </div>
    );
};

export default QuizPage;
