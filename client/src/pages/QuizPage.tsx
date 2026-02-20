import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Timer, ClipboardCheck, AlertCircle, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
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
        enabled: !!quizId,
    });

    // Timer Logic
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
    }, [isStudent, quiz?.id, attemptId]);

    useEffect(() => {
        if (!isTimerReady || isFinished || isSubmittingAttempt) return;

        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && quiz) {
            handleFinish();
        }
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
            setAnswers(prev => ({ ...prev, [questionId]: option }));
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

    if (isLoading) return (
        <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-secondary font-medium">Downloading assessment content...</p>
        </div>
    );

    if (isError || !quiz) return (
        <div className="card-premium p-20 text-center space-y-4 max-w-2xl mx-auto mt-10">
            <AlertCircle size={64} className="mx-auto text-accent-red/20 mb-4" />
            <h2 className="text-2xl font-bold">Quiz Not Found</h2>
            <p className="text-secondary">We couldn't retrieve the quiz details. It may be restricted or unavailable.</p>
            <button onClick={() => navigate('/app/quizzes')} className="btn-gradient px-8 py-3">View All Quizzes</button>
        </div>
    );

    const questions = quiz.questions || [];
    const currentQuestion = questions[currentQuestionIdx];

    if (questions.length === 0) {
        return (
            <div className="card-premium p-20 text-center space-y-4 max-w-2xl mx-auto mt-10">
                <AlertCircle size={64} className="mx-auto text-accent-red/20 mb-4" />
                <h2 className="text-2xl font-bold">Quiz Unavailable</h2>
                <p className="text-secondary">This quiz has no questions yet. Please contact your teacher.</p>
                <button onClick={() => navigate('/app/quizzes')} className="btn-gradient px-8 py-3">Back to Quizzes</button>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="h-full flex items-center justify-center animate-in zoom-in duration-500">
                <div className="card-premium p-12 text-center space-y-8 max-w-xl w-full border-none shadow-medium bg-white">
                    <div className="w-24 h-24 bg-green-100 rounded-[2.5rem] flex items-center justify-center text-green-600 mx-auto">
                        <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-extrabold text-gray-900 font-headlines">Quiz Completed!</h2>
                        <p className="text-secondary text-lg">Your responses have been securely submitted for evaluation.</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-6 flex justify-around">
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Questions</p>
                            <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Attempts</p>
                            <p className="text-2xl font-bold text-gray-900">{Object.keys(answers).length}</p>
                        </div>
                        {isStudent && finalScore !== null && (
                            <div className="text-center">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Score</p>
                                <p className="text-2xl font-bold text-gray-900">{finalScore}/{quiz.totalMarks}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/app/quizzes')}
                        className="btn-gradient w-full py-4 text-lg"
                    >
                        Success, Back to List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col pb-10">
            {/* Header / Meta */}
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <ClipboardCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 line-clamp-1">{quiz.title}</h1>
                        <p className="text-xs text-secondary font-medium">Question {currentQuestionIdx + 1} of {questions.length}</p>
                    </div>
                </div>

                <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold font-mono text-xl ${timeLeft < 60 ? 'bg-red-50 text-accent-red animate-pulse' : 'bg-gray-50 text-gray-900'
                    }`}>
                    <Timer size={20} />
                    {formatTime(timeLeft)}
                </div>
            </div>

            {attemptError && (
                <div className="card-premium border border-red-100 bg-red-50 text-red-700 px-6 py-4">
                    {attemptError}
                </div>
            )}

            {/* Question Card */}
            <div className="flex-grow grid grid-cols-1 gap-8 min-h-0">
                <div className="card-premium !p-12 space-y-10 flex flex-col">
                    <div className="space-y-6">
                        <span className="px-3 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                            Current Question
                        </span>
                        <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                            {currentQuestion?.question}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow content-start">
                        {Object.entries(currentQuestion?.options || {}).map(([key, value]) => (
                            <button
                                key={key}
                                onClick={() => handleAnswer(key)}
                                className={`group p-6 rounded-2xl border-2 transition-all flex items-center gap-6 text-left ${answers[currentQuestion.id] === key
                                    ? 'border-primary bg-primary/5 shadow-medium'
                                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all ${answers[currentQuestion.id] === key
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                                    }`}>
                                    {key}
                                </div>
                                <span className={`font-medium text-lg ${answers[currentQuestion.id] === key ? 'text-gray-900' : 'text-secondary'
                                    }`}>
                                    {value}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Footer Nav */}
                    <div className="flex items-center justify-between pt-10 border-t border-gray-50">
                        <button
                            disabled={currentQuestionIdx === 0}
                            onClick={() => setCurrentQuestionIdx(idx => idx - 1)}
                            className="px-8 py-3 border-2 border-gray-100 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-200 transition-all"
                        >
                            Previous
                        </button>

                        {currentQuestionIdx === questions.length - 1 ? (
                            <button
                                onClick={handleFinish}
                                disabled={isStartingAttempt || isSubmittingAttempt}
                                className="btn-gradient px-12 py-3 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmittingAttempt
                                    ? 'Submitting...'
                                    : isStartingAttempt
                                        ? 'Starting Attempt...'
                                        : 'Submit All Answers'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIdx(idx => idx + 1)}
                                className="btn-gradient px-10 py-3 font-bold flex items-center gap-2"
                            >
                                Next Question
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
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
