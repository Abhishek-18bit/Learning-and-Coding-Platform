import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ChevronLeft, Loader2, FileText, Layers, ListTree } from 'lucide-react';
import { lessonService } from '../services/lesson.service';
import { courseService } from '../services/course.service';
import { applyRichTextPasteToTextarea } from '../utils/richTextPaste';

const LessonCreatePage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const [searchParams] = useSearchParams();
    const prefillUnitId = searchParams.get('unitId') || '';
    const prefillTopicId = searchParams.get('topicId') || '';
    const prefillTopicTitle = searchParams.get('topicTitle') || '';
    const prefillMinutes = searchParams.get('estimatedMinutes') || '';
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [unitMode, setUnitMode] = useState<'existing' | 'new'>('existing');
    const [selectedUnitId, setSelectedUnitId] = useState(prefillUnitId);
    const [newUnitTitle, setNewUnitTitle] = useState('');
    const [topicTitle, setTopicTitle] = useState(prefillTopicTitle);
    const [estimatedMinutes, setEstimatedMinutes] = useState(prefillMinutes || '30');

    const { data: units = [], isLoading: unitsLoading } = useQuery({
        queryKey: ['course-units', courseId],
        queryFn: () => courseService.getUnits(courseId!),
        enabled: Boolean(courseId),
    });

    useEffect(() => {
        if (!selectedUnitId && units.length > 0) {
            setSelectedUnitId(units[0].id);
        }
    }, [units, selectedUnitId]);

    useEffect(() => {
        if (prefillUnitId) {
            setUnitMode('existing');
            setSelectedUnitId(prefillUnitId);
        }
    }, [prefillUnitId]);

    const mutation = useMutation({
        mutationFn: () => {
            const minutesValue = Number(estimatedMinutes);
            return lessonService.create({
                title,
                content,
                courseId: courseId!,
                unitId: unitMode === 'existing' ? selectedUnitId || undefined : undefined,
                topicId: prefillTopicId || undefined,
                unitTitle: unitMode === 'new' ? newUnitTitle.trim() || undefined : undefined,
                topicTitle: topicTitle.trim() || undefined,
                estimatedMinutes: Number.isFinite(minutesValue) && minutesValue > 0 ? minutesValue : undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
            queryClient.invalidateQueries({ queryKey: ['course-units', courseId] });
            navigate(`/app/course/${courseId}`);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId) {
            return;
        }

        if (!title.trim() || !content.trim()) {
            return;
        }

        if (unitMode === 'new' && !newUnitTitle.trim()) {
            return;
        }

        if (unitMode === 'existing' && units.length > 0 && !selectedUnitId) {
            return;
        }

        if (!topicTitle.trim()) {
            return;
        }

        if (!estimatedMinutes.trim() || Number(estimatedMinutes) <= 0) {
            return;
        }

        if (courseId) {
            mutation.mutate();
        }
    };

    const handleContentPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        applyRichTextPasteToTextarea(event, content, setContent);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-gray-50 rounded-2xl shadow-soft hover:bg-gray-100 transition-all text-secondary"
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
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-gray-50 rounded-2xl outline-none transition-all font-bold text-xl text-gray-900 placeholder:text-muted"
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">Content (Markdown)</label>
                            <textarea
                                placeholder="Write your lesson content here... Supports standard Markdown syntax."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onPaste={handleContentPaste}
                                rows={15}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-gray-50 rounded-2xl outline-none transition-all font-mono text-sm leading-relaxed text-gray-900 placeholder:text-muted"
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">Unit</label>
                                <button
                                    type="button"
                                    onClick={() => setUnitMode((prev) => (prev === 'existing' ? 'new' : 'existing'))}
                                    disabled={Boolean(prefillTopicId)}
                                    className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted transition hover:border-primary-blue/50 hover:text-primary-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {unitMode === 'existing' ? 'Create New Unit' : 'Use Existing Unit'}
                                </button>
                            </div>

                            {prefillTopicId ? (
                                <div className="rounded-2xl border border-primary-blue/35 bg-primary-blue/10 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-cyan">
                                        Add Content To Existing Topic
                                    </p>
                                    <p className="mt-1 text-sm text-gray-700">
                                        Publishing this lesson will attach it to the selected topic.
                                    </p>
                                </div>
                            ) : null}

                            {unitMode === 'existing' ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Layers className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                                        <select
                                            value={selectedUnitId}
                                            onChange={(e) => setSelectedUnitId(e.target.value)}
                                            className="w-full appearance-none rounded-2xl border border-border bg-card px-11 py-3 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-primary-blue/50"
                                            disabled={unitsLoading || Boolean(prefillTopicId)}
                                        >
                                            {units.length === 0 ? (
                                                <option value="">No units yet (new unit will be created automatically)</option>
                                            ) : null}
                                            {units.map((unit) => (
                                                <option key={unit.id} value={unit.id}>
                                                    {`Unit ${unit.sortOrder}: ${unit.title}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-xs text-muted">
                                        {units.length > 0
                                            ? 'Attach this lesson to an existing unit.'
                                            : 'No unit exists yet, so this lesson will create Unit 1 unless you set a unit title.'}
                                    </p>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={newUnitTitle}
                                    onChange={(e) => setNewUnitTitle(e.target.value)}
                                    placeholder="e.g. Unit 2 - Requirements Engineering"
                                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-primary-blue/50"
                                    required={unitMode === 'new'}
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">Topic Title</label>
                                <div className="relative">
                                    <ListTree className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                                    <input
                                        type="text"
                                        value={topicTitle}
                                        onChange={(e) => setTopicTitle(e.target.value)}
                                        placeholder="e.g. SDLC Overview"
                                        className="w-full rounded-2xl border border-border bg-card px-11 py-3 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-primary-blue/50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">Estimated Minutes</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={240}
                                    value={estimatedMinutes}
                                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-primary-blue/50"
                                    required
                                />
                            </div>
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
                            disabled={
                                mutation.isPending ||
                                !title.trim() ||
                                !content.trim() ||
                                !topicTitle.trim() ||
                                !estimatedMinutes.trim() ||
                                Number(estimatedMinutes) <= 0 ||
                                (unitMode === 'new' && !newUnitTitle.trim())
                            }
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
