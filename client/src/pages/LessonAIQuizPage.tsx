import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Radar, Sparkles } from 'lucide-react';
import GenerateQuizModal from '../components/GenerateQuizModal';
import { useAuth } from '../contexts/AuthContext';
import { lessonService, type Lesson } from '../services/lesson.service';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const LessonAIQuizPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: lessons, isLoading, isError } = useQuery({
        queryKey: ['course-lessons', courseId],
        queryFn: () => lessonService.getByCourseId(courseId!),
        enabled: Boolean(courseId),
    });

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="typ-muted font-medium">Loading...</div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') return <Navigate to="/app/dashboard" replace />;

    const totalLessons = lessons?.length || 0;
    const readyLessons = (lessons || []).filter((lesson) => Boolean(lesson.content?.trim())).length;

    return (
        <div className="mission-page">
            <section className="mission-shell p-6 lg:p-7">
                <div className="mission-shell-content flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Link
                            to={`/app/course/${courseId}/quiz/create`}
                            className="text-xs font-bold uppercase tracking-widest text-primary-cyan hover:underline"
                        >
                            Back to Quiz Creation Options
                        </Link>
                        <h1 className="mission-title mt-3">Generate from Lesson (AI)</h1>
                        <p className="mission-subtitle">Select lesson content and generate a teacher-editable quiz draft.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mission-chip">
                            <BookOpen size={13} />
                            {totalLessons} lessons
                        </span>
                        <span className="mission-chip">
                            <Radar size={13} />
                            {readyLessons} content-ready
                        </span>
                    </div>
                </div>
            </section>

            {isLoading ? (
                <Card variant="layered" className="p-8 text-center">
                    <p className="typ-muted">Loading lessons...</p>
                </Card>
            ) : null}

            {isError ? (
                <Card variant="layered" className="border border-error/35 bg-error/15 p-4 text-sm text-error">
                    Failed to load lessons.
                </Card>
            ) : null}

            {!isLoading && lessons && lessons.length === 0 ? (
                <Card variant="layered" className="p-10 text-center">
                    <p className="typ-muted">No lessons available for this course yet.</p>
                </Card>
            ) : null}

            <div className="space-y-3">
                {lessons?.map((lesson) => {
                    const hasContent = Boolean(lesson.content?.trim());
                    return (
                        <Card key={lesson.id} variant="glass" className="p-4" hoverLift>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-gray-900">{lesson.title}</p>
                                    <p className="mt-1 text-xs text-muted line-clamp-2">
                                        {hasContent ? lesson.content : 'This lesson has no content yet.'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant={hasContent ? 'success' : 'warning'}>
                                        {hasContent ? 'Ready' : 'No Content'}
                                    </Badge>
                                    <Button
                                        variant={hasContent ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => {
                                            setSelectedLesson(lesson);
                                            setIsModalOpen(true);
                                        }}
                                        disabled={!hasContent}
                                    >
                                        {hasContent ? <Sparkles size={14} /> : <BookOpen size={14} />}
                                        {hasContent ? 'Generate' : 'Unavailable'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {selectedLesson ? (
                <GenerateQuizModal
                    isOpen={isModalOpen}
                    lessonId={selectedLesson.id}
                    courseId={courseId!}
                    lessonTitle={selectedLesson.title}
                    hasLessonContent={Boolean(selectedLesson.content?.trim())}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedLesson(null);
                    }}
                    onSaved={(quizId) => navigate(`/app/quizzes/${quizId}/manage`)}
                />
            ) : null}
        </div>
    );
};

export default LessonAIQuizPage;
