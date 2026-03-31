import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    BookOpen,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Code2,
    FileText,
    Loader2,
    PlayCircle,
    Plus,
    Radar,
    Sparkles,
} from 'lucide-react';
import { lessonService } from '../services/lesson.service';
import { problemService } from '../services/problem.service';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import GenerateQuizModal from '../components/GenerateQuizModal';
import ContextChatPanel from '../components/chat/ContextChatPanel';
import { renderContentHtml } from '../utils/contentRenderer';

const LessonPage = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [lessonContentError, setLessonContentError] = useState('');

    const { data: lesson, isLoading, isError } = useQuery({
        queryKey: ['lesson', lessonId],
        queryFn: () => lessonService.getById(lessonId!),
        enabled: Boolean(lessonId),
    });

    const { data: lessonProblems, isLoading: problemsLoading } = useQuery({
        queryKey: ['problems', lessonId],
        queryFn: () => problemService.getProblemsByLesson(lessonId!),
        enabled: Boolean(lessonId),
    });

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="typ-muted font-medium">Fetching lesson materials...</p>
            </div>
        );
    }

    if (isError || !lesson) {
        return (
            <Card variant="layered" className="p-10 text-center space-y-4 max-w-2xl mx-auto mt-10">
                <h2 className="typ-h2 !text-2xl mb-0">Failed to load lesson</h2>
                <div className="flex justify-center">
                    <Button variant="primary" onClick={() => navigate(-1)}>Go Back</Button>
                </div>
            </Card>
        );
    }

    const isTeacher = user?.role === 'TEACHER';
    const hasLessonContent = Boolean(lesson.content?.trim());
    const lessonProblemCount = lessonProblems?.length || 0;
    const lessonContentHtml = useMemo(() => renderContentHtml(lesson.content || ''), [lesson.content]);

    return (
        <div className="mission-page pb-10">
            <section className="mission-shell p-6 lg:p-7">
                <div className="mission-shell-content space-y-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-gray-700"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <span className="mission-kicker">
                                <span className="mission-kicker-dot" />
                                Lesson Module
                            </span>
                            <h1 className="mission-title mt-3">{lesson.title}</h1>
                            <p className="mission-subtitle">
                                Continue the lesson path and apply concepts through coding challenges.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="mission-chip">
                                <BookOpen size={13} />
                                Lesson content
                            </span>
                            <span className="mission-chip">
                                <Code2 size={13} />
                                {lessonProblemCount} problems
                            </span>
                            <span className="mission-chip">
                                <Radar size={13} />
                                Live class chat
                            </span>
                        </div>
                    </div>

                    <div className="mission-toolbar">
                        {isTeacher ? (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    if (!hasLessonContent) {
                                        setLessonContentError('Lesson content is empty. Add content before generating a quiz.');
                                        return;
                                    }
                                    setLessonContentError('');
                                    setShowGenerateModal(true);
                                }}
                            >
                                <Sparkles size={15} />
                                Generate Quiz
                            </Button>
                        ) : null}

                        <Button variant="ghost" size="sm" className="border border-border">
                            <FileText size={15} />
                            Resources
                        </Button>

                        <Button variant="primary" size="sm">
                            <CheckCircle size={15} />
                            Mark as Complete
                        </Button>
                    </div>
                </div>
            </section>

            {lessonContentError ? (
                <Card variant="layered" className="border border-error/35 bg-error/15 px-4 py-3 text-sm text-error">
                    {lessonContentError}
                </Card>
            ) : null}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="space-y-6">
                    <Card variant="layered" className="space-y-4">
                        <div>
                            <p className="mission-panel-title">Lesson Content</p>
                            <h2 className="typ-h2 !text-2xl mb-1 mt-2">Concept walkthrough</h2>
                        </div>
                        <div className="rounded-xl border border-border bg-card/70 p-5 min-h-[360px]">
                            <div
                                className="max-h-[34rem] overflow-y-auto pr-1"
                                dangerouslySetInnerHTML={{ __html: lessonContentHtml }}
                            />
                        </div>
                    </Card>

                    <Card variant="glass" className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="mission-panel-title">Coding Problems</p>
                                <h2 className="typ-h2 !text-2xl mb-1 mt-2">Practice challenges</h2>
                                <p className="typ-muted">Problems linked to this lesson for hands-on reinforcement.</p>
                            </div>
                            {isTeacher ? (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => navigate(`/app/lesson/${lesson.id}/problem/create`)}
                                >
                                    <Plus size={14} />
                                    Add Problem
                                </Button>
                            ) : null}
                        </div>

                        {problemsLoading ? (
                            <div className="py-10 text-center text-sm text-muted">Loading problems...</div>
                        ) : lessonProblems && lessonProblems.length > 0 ? (
                            <div className="space-y-3">
                                {lessonProblems.map((problem) => (
                                    <div
                                        key={problem.id}
                                        className="rounded-xl border border-border bg-card/70 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-blue/15 text-primary-cyan">
                                                <Code2 size={17} />
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-semibold text-gray-900 truncate">{problem.title}</h3>
                                                <p className="text-xs text-muted mt-1 line-clamp-2">{problem.description}</p>
                                                <div className="mt-2">
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
                                            </div>
                                        </div>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => navigate(`/app/problem/${problem.id}`)}
                                        >
                                            {user?.role === 'STUDENT' ? 'Solve' : 'Open'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                                No coding problems published for this lesson yet.
                            </div>
                        )}
                    </Card>

                    <Card variant="layered" className="flex items-center justify-between gap-4">
                        <Button variant="ghost" size="sm" className="border border-border">
                            <ChevronLeft size={16} />
                            Previous Lesson
                        </Button>
                        <Button variant="secondary" size="sm">
                            Next Lesson
                            <ChevronRight size={16} />
                        </Button>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card variant="layered" className="space-y-4">
                        <div>
                            <p className="mission-panel-title">Lesson Index</p>
                            <h3 className="typ-h3 !text-xl mb-1 mt-2">Module sequence</h3>
                        </div>
                        <div className="space-y-2">
                            {[1, 2, 3].map((index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                                        index === 1
                                            ? 'border-primary-blue/45 bg-primary-blue/12 text-primary-cyan'
                                            : 'border-border bg-card/70 text-muted'
                                    }`}
                                >
                                    <PlayCircle size={16} />
                                    <span className="text-sm font-semibold">Module {index}: Advanced Patterns</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card variant="glass" className="space-y-3">
                        <h4 className="typ-h3 !mb-0 !text-lg">Next Milestone</h4>
                        <p className="typ-muted">
                            Complete this lesson to unlock accompanying coding challenges and assessments.
                        </p>
                        <ProgressBar value={33} showLabel />
                    </Card>

                    <ContextChatPanel
                        contextType="LESSON"
                        contextId={lesson.id}
                        title="Lesson Chat"
                        subtitle="Discuss concepts with your class in realtime."
                    />
                </div>
            </div>

            {isTeacher ? (
                <GenerateQuizModal
                    isOpen={showGenerateModal}
                    lessonId={lesson.id}
                    courseId={lesson.courseId}
                    lessonTitle={lesson.title}
                    hasLessonContent={hasLessonContent}
                    onClose={() => setShowGenerateModal(false)}
                    onSaved={(quizId) => navigate(`/app/quizzes/${quizId}/manage`)}
                />
            ) : null}
        </div>
    );
};

export default LessonPage;
