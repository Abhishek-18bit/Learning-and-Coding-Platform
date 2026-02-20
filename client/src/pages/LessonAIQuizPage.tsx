import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Sparkles } from 'lucide-react';
import GenerateQuizModal from '../components/GenerateQuizModal';
import { useAuth } from '../contexts/AuthContext';
import { lessonService, type Lesson } from '../services/lesson.service';

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
                <div className="text-secondary font-medium">Loading...</div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') return <Navigate to="/app/dashboard" replace />;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="space-y-2">
                <Link to={`/app/course/${courseId}/quiz/create`} className="text-xs font-bold uppercase tracking-widest text-primary hover:underline">
                    Back to Quiz Creation Options
                </Link>
                <h1 className="text-3xl font-bold font-headlines text-gray-900">Generate from Lesson (AI)</h1>
                <p className="text-secondary">Choose a lesson and generate a quiz draft from its content.</p>
            </div>

            {isLoading && (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-secondary">
                    Loading lessons...
                </div>
            )}

            {isError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    Failed to load lessons.
                </div>
            )}

            {!isLoading && lessons && lessons.length === 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-secondary">
                    No lessons available for this course yet.
                </div>
            )}

            <div className="space-y-3">
                {lessons?.map((lesson) => {
                    const hasContent = Boolean(lesson.content?.trim());
                    return (
                        <div key={lesson.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft flex items-center justify-between gap-4">
                            <div className="space-y-1 overflow-hidden">
                                <h3 className="font-bold text-gray-900 truncate">{lesson.title}</h3>
                                <p className="text-xs text-secondary line-clamp-2">
                                    {hasContent ? lesson.content : 'This lesson has no content yet.'}
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedLesson(lesson);
                                    setIsModalOpen(true);
                                }}
                                disabled={!hasContent}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider hover:bg-primary/15 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {hasContent ? <Sparkles size={14} /> : <BookOpen size={14} />}
                                {hasContent ? 'Generate Quiz' : 'No Content'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {selectedLesson && (
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
            )}
        </div>
    );
};

export default LessonAIQuizPage;
