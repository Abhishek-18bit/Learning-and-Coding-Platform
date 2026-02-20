import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, BookOpen, Loader2, PlayCircle, FileText, CheckCircle, Sparkles, Code2, Plus } from 'lucide-react';
import { lessonService } from '../services/lesson.service';
import { problemService } from '../services/problem.service';
import { useAuth } from '../contexts/AuthContext';
import GenerateQuizModal from '../components/GenerateQuizModal';
import ContextChatPanel from '../components/chat/ContextChatPanel';

const LessonPage = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [lessonContentError, setLessonContentError] = useState('');

    const { data: lesson, isLoading, isError } = useQuery({
        queryKey: ['lesson', lessonId],
        queryFn: () => lessonService.getById(lessonId!),
        enabled: !!lessonId,
    });
    const { data: lessonProblems, isLoading: problemsLoading } = useQuery({
        queryKey: ['problems', lessonId],
        queryFn: () => problemService.getProblemsByLesson(lessonId!),
        enabled: !!lessonId,
    });

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-secondary font-medium italic">Fetching lesson materials...</p>
            </div>
        );
    }

    if (isError || !lesson) {
        return (
            <div className="p-10 text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Failed to load lesson</h2>
                <button onClick={() => navigate(-1)} className="btn-gradient px-6 py-2">Go Back</button>
            </div>
        );
    }

    const isTeacher = user?.role === 'TEACHER';
    const hasLessonContent = Boolean(lesson.content?.trim());

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-2xl shadow-soft hover:bg-gray-50 transition-all text-secondary"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary/60">Module Content</span>
                        <h1 className="text-3xl font-bold text-gray-900 font-headlines leading-none">{lesson.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isTeacher && (
                        <button
                            onClick={() => {
                                if (!hasLessonContent) {
                                    setLessonContentError('Lesson content is empty. Add content before generating a quiz.');
                                    return;
                                }
                                setLessonContentError('');
                                setShowGenerateModal(true);
                            }}
                            className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-primary hover:bg-primary/5 transition-all flex items-center gap-2"
                        >
                            <Sparkles size={18} />
                            Generate Quiz
                        </button>
                    )}
                    <button className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-secondary hover:text-primary transition-all flex items-center gap-2">
                        <FileText size={18} />
                        Resources
                    </button>
                    <button className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
                        <CheckCircle size={18} />
                        Mark as Complete
                    </button>
                </div>
            </div>
            {lessonContentError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {lessonContentError}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Content Area */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="card-premium !p-12 prose prose-lg prose-primary max-w-none min-h-[500px]">
                        <div className="text-gray-800 leading-relaxed space-y-6">
                            {/* In a real app we'd use a Markdown component here */}
                            <div className="whitespace-pre-wrap font-medium">
                                {lesson.content}
                            </div>
                        </div>
                    </div>

                    <div className="card-premium space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-headlines">Coding Problems</h2>
                                <p className="text-sm text-secondary mt-1">Practice challenges linked with this lesson.</p>
                            </div>
                            {isTeacher && (
                                <button
                                    onClick={() => navigate(`/app/lesson/${lesson.id}/problem/create`)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-all"
                                >
                                    <Plus size={16} />
                                    Add Problem
                                </button>
                            )}
                        </div>

                        {problemsLoading ? (
                            <div className="py-10 text-center text-secondary text-sm">
                                Loading problems...
                            </div>
                        ) : lessonProblems && lessonProblems.length > 0 ? (
                            <div className="space-y-3">
                                {lessonProblems.map((problem) => (
                                    <div key={problem.id} className="rounded-xl border border-gray-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                                <Code2 size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{problem.title}</h3>
                                                <p className="text-xs text-secondary mt-1 line-clamp-2">{problem.description}</p>
                                                <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold ${problem.difficulty === 'EASY'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : problem.difficulty === 'MEDIUM'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {problem.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/app/problem/${problem.id}`)}
                                            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                                        >
                                            {user?.role === 'STUDENT' ? 'Solve' : 'Open'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-secondary">
                                No coding problems published for this lesson yet.
                            </div>
                        )}
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                        <button className="flex items-center gap-3 text-secondary font-bold hover:text-primary transition-colors group">
                            <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-primary/10 transition-colors">
                                <ChevronLeft size={20} />
                            </div>
                            Previous Lesson
                        </button>
                        <button className="flex items-center gap-3 text-primary font-bold hover:text-primary-dark transition-colors group">
                            Next Lesson
                            <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <ChevronRight size={20} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    <div className="card-premium space-y-6">
                        <h3 className="text-lg font-bold font-headlines flex items-center gap-2">
                            <BookOpen size={20} className="text-primary" />
                            Lesson Index
                        </h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${i === 1 ? 'bg-primary/5 text-primary border border-primary/10' : 'text-secondary hover:bg-gray-50 cursor-pointer'}`}>
                                    <PlayCircle size={18} className={i === 1 ? 'text-primary' : 'text-gray-300'} />
                                    <span className="text-sm font-bold leading-tight">Module {i}: Advanced Patterns</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card-premium bg-gray-900 text-white !border-none !p-8 space-y-4">
                        <h4 className="font-bold">Next Milestone</h4>
                        <p className="text-xs text-white/50 leading-relaxed">Complete this lesson to unlock the accompanying coding challenges and assessments.</p>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-1/3 rounded-full"></div>
                        </div>
                    </div>

                    <ContextChatPanel
                        contextType="LESSON"
                        contextId={lesson.id}
                        title="Lesson Chat"
                        subtitle="Discuss concepts with your class in realtime."
                    />
                </div>
            </div>
            {isTeacher && (
                <GenerateQuizModal
                    isOpen={showGenerateModal}
                    lessonId={lesson.id}
                    courseId={lesson.courseId}
                    lessonTitle={lesson.title}
                    hasLessonContent={hasLessonContent}
                    onClose={() => setShowGenerateModal(false)}
                    onSaved={(quizId) => navigate(`/app/quizzes/${quizId}/manage`)}
                />
            )}
        </div>
    );
};

export default LessonPage;
