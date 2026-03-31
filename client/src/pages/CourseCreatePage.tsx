import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, ChevronLeft, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { courseService } from '../services/course.service';
import { applyRichTextPasteToTextarea } from '../utils/richTextPaste';

const CourseCreatePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const mutation = useMutation({
        mutationFn: () => courseService.create({ title, description }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            navigate('/app/dashboard');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            mutation.mutate();
        }
    };

    const handleDescriptionPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        applyRichTextPasteToTextarea(event, description, setDescription);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-gray-50 rounded-2xl shadow-soft hover:bg-gray-100 transition-all text-secondary"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-headlines">Create New Course</h1>
                    <p className="text-secondary mt-1">Foundational details for your new educational path.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Form Side */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleSubmit} className="card-premium space-y-8 !p-10">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">Course Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Master Modern System Design"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-gray-50 rounded-2xl outline-none transition-all font-bold text-lg text-gray-900 placeholder:text-muted"
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">Description</label>
                            <textarea
                                placeholder="Describe what students will achieve..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onPaste={handleDescriptionPaste}
                                rows={6}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-gray-50 rounded-2xl outline-none transition-all font-medium leading-relaxed text-gray-900 placeholder:text-muted"
                            />
                        </div>

                        <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-10 py-4 font-bold text-secondary hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={mutation.isPending || !title}
                                className="btn-gradient px-12 py-4 text-lg shadow-xl shadow-primary/20 flex items-center gap-3 disabled:opacity-50"
                            >
                                {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                                Publish Course
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Side */}
                <div className="space-y-8">
                    <div className="card-premium bg-gray-900 text-white !border-none">
                        <AlertCircle className="text-primary mb-4" size={32} />
                        <h3 className="text-xl font-bold mb-4">Course Guidelines</h3>
                        <ul className="space-y-4 text-sm text-white/60 font-medium">
                            <li className="flex gap-3">
                                <Plus size={16} className="text-primary flex-shrink-0" />
                                Start with a compelling title that clearly defines the goal.
                            </li>
                            <li className="flex gap-3">
                                <Plus size={16} className="text-primary flex-shrink-0" />
                                Keep the description concise but informative.
                            </li>
                            <li className="flex gap-3">
                                <Plus size={16} className="text-primary flex-shrink-0" />
                                You can add lessons and problems once the course is created.
                            </li>
                        </ul>
                    </div>

                    <div className="card-premium space-y-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <BookOpen />
                        </div>
                        <h4 className="font-bold">Next Steps</h4>
                        <p className="text-xs text-secondary leading-relaxed">After publishing, you'll be redirected to your dashboard where you can manage course content in detail.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseCreatePage;
