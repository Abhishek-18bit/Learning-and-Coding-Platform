import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ChevronLeft, Loader2, FileText } from 'lucide-react';
import { lessonService } from '../services/lesson.service';

const LessonCreatePage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const mutation = useMutation({
        mutationFn: () => lessonService.create({ title, content, courseId: courseId! }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
            navigate(`/app/course/${courseId}`);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && content.trim() && courseId) {
            mutation.mutate();
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white rounded-2xl shadow-soft hover:bg-gray-50 transition-all text-secondary"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-headlines">Draft New Lesson</h1>
                    <p className="text-secondary mt-1">Structure your knowledge with markdown-powered content.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <div className="card-premium space-y-8 !p-10">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">Lesson Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Introduction to Concurrent Programming"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-xl"
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">Content (Markdown)</label>
                            <textarea
                                placeholder="Write your lesson content here... Supports standard Markdown syntax."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={15}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-sm leading-relaxed"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="card-premium space-y-6">
                        <div className="flex items-center gap-3 text-primary">
                            <FileText size={24} />
                            <h3 className="font-bold text-lg">Publishing Tips</h3>
                        </div>
                        <p className="text-sm text-secondary leading-relaxed">
                            A great lesson is clear, concise, and focused on a single learning objective.
                            Use code blocks to illustrate complex concepts.
                        </p>
                        <ul className="space-y-3 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div> Auto-saves to database</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div> Markdown support active</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div> Instant student access</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <button
                            type="submit"
                            disabled={mutation.isPending || !title || !content}
                            className="w-full btn-gradient py-5 text-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                            Publish Lesson
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="w-full py-4 font-bold text-secondary hover:text-gray-900 transition-colors"
                        >
                            Discard Draft
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default LessonCreatePage;
