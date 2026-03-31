import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ChevronLeft, Eye, Loader2, PenSquare, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { lessonService } from '../services/lesson.service';
import { type Difficulty, problemService } from '../services/problem.service';

interface TestCaseDraft {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

interface FormErrors {
    lessonId?: string;
    title?: string;
    description?: string;
    inputFormat?: string;
    outputFormat?: string;
    constraints?: string;
    starterCode?: string;
    testCases?: string;
}

const createTestCaseDraft = (): TestCaseDraft => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    input: '',
    expectedOutput: '',
    isHidden: true,
});

const escapeHtml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');

const renderMarkdown = (markdown: string): string => {
    const trimmed = markdown.trim();
    if (!trimmed) {
        return '<p class="text-secondary italic">Live preview will appear here.</p>';
    }

    const escaped = escapeHtml(trimmed);
    const html = escaped
        .replace(/```([\s\S]*?)```/g, '<pre class="rounded-xl bg-gray-100 p-4 overflow-x-auto my-3"><code>$1</code></pre>')
        .replace(/^### (.*)$/gm, '<h3 class="text-lg font-bold text-gray-900 mt-4">$1</h3>')
        .replace(/^## (.*)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-4">$1</h2>')
        .replace(/^# (.*)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-4">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">$1</code>')
        .replace(/\n\n/g, '</p><p class="mt-3">')
        .replace(/\n/g, '<br />');

    return `<p>${html}</p>`;
};

const ProblemCreatePage = () => {
    const { lessonId: lessonIdParam, courseId: courseIdParam } = useParams<{ lessonId?: string; courseId?: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, loading: authLoading } = useAuth();

    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [inputFormat, setInputFormat] = useState('');
    const [outputFormat, setOutputFormat] = useState('');
    const [constraints, setConstraints] = useState('');
    const [starterCode, setStarterCode] = useState('function solve(input) {\n  // Write your code here\n  return input;\n}');
    const [selectedLessonId, setSelectedLessonId] = useState(lessonIdParam || '');
    const [testCases, setTestCases] = useState<TestCaseDraft[]>([createTestCaseDraft()]);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [apiError, setApiError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [createdProblemId, setCreatedProblemId] = useState('');

    const lessonQuery = useQuery({
        queryKey: ['lesson', lessonIdParam],
        queryFn: () => lessonService.getById(lessonIdParam!),
        enabled: Boolean(lessonIdParam),
    });

    const resolvedCourseId = courseIdParam || lessonQuery.data?.courseId || '';

    const lessonsQuery = useQuery({
        queryKey: ['course-lessons', resolvedCourseId],
        queryFn: () => lessonService.getByCourseId(resolvedCourseId),
        enabled: Boolean(resolvedCourseId),
    });

    const markdownPreview = useMemo(() => renderMarkdown(description), [description]);

    const createMutation = useMutation({
        mutationFn: () =>
            problemService.create({
                title: title.trim(),
                description: description.trim(),
                difficulty,
                inputFormat: inputFormat.trim(),
                outputFormat: outputFormat.trim(),
                constraints: constraints.trim(),
                starterCode: starterCode.trim(),
                lessonId: selectedLessonId,
                testCases: testCases.map((testCase) => ({
                    input: testCase.input.trim(),
                    expectedOutput: testCase.expectedOutput.trim(),
                    isHidden: testCase.isHidden,
                })),
            }),
        onSuccess: (problem) => {
            setApiError('');
            setSuccessMessage('Problem created successfully.');
            setCreatedProblemId(problem.id);
            queryClient.invalidateQueries({ queryKey: ['problems'] });
            if (selectedLessonId) {
                queryClient.invalidateQueries({ queryKey: ['problems', selectedLessonId] });
            }
            queryClient.invalidateQueries({ queryKey: ['lesson', selectedLessonId] });
        },
        onError: (error) => {
            const axiosError = error as AxiosError<{ message?: string }>;
            setApiError(axiosError.response?.data?.message || 'Failed to create problem. Please try again.');
            setSuccessMessage('');
        },
    });

    const validate = () => {
        const errors: FormErrors = {};

        if (!title.trim()) errors.title = 'Title is required.';
        if (!selectedLessonId.trim()) errors.lessonId = 'Lesson selection is required.';
        if (!description.trim()) errors.description = 'Description is required.';
        if (!inputFormat.trim()) errors.inputFormat = 'Input format is required.';
        if (!outputFormat.trim()) errors.outputFormat = 'Output format is required.';
        if (!constraints.trim()) errors.constraints = 'Constraints are required.';
        if (!starterCode.trim()) errors.starterCode = 'Starter code is required.';

        if (!testCases.length) {
            errors.testCases = 'At least one test case is required.';
        } else if (testCases.some((testCase) => !testCase.input.trim() || !testCase.expectedOutput.trim())) {
            errors.testCases = 'Each test case needs both input and expected output.';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setApiError('');
        setSuccessMessage('');
        setCreatedProblemId('');

        if (!validate()) {
            return;
        }

        createMutation.mutate();
    };

    const updateTestCase = (id: string, key: keyof TestCaseDraft, value: string | boolean) => {
        setTestCases((current) =>
            current.map((testCase) =>
                testCase.id === id
                    ? {
                        ...testCase,
                        [key]: value,
                    }
                    : testCase
            )
        );
    };

    const removeTestCase = (id: string) => {
        setTestCases((current) => current.filter((testCase) => testCase.id !== id));
    };

    if (authLoading || (lessonIdParam && lessonQuery.isLoading)) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={30} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!isTeacher) {
        return <Navigate to="/app/dashboard" replace />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="p-3 rounded-xl border border-gray-100 bg-gray-50 shadow-soft hover:bg-gray-100 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-headlines">Create Coding Problem</h1>
                    <p className="text-secondary mt-1">Design LeetCode-style challenges with hidden and visible test cases.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <section className="card-premium space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                            <input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="e.g. Longest Substring Without Repeating Characters"
                                disabled={createMutation.isPending}
                            />
                            {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                                <select
                                    value={difficulty}
                                    onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    disabled={createMutation.isPending}
                                >
                                    <option value="EASY">EASY</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="HARD">HARD</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Lesson</label>
                                <select
                                    value={selectedLessonId}
                                    onChange={(event) => setSelectedLessonId(event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-100"
                                    disabled={createMutation.isPending || lessonsQuery.isLoading || !resolvedCourseId}
                                >
                                    <option value="">Select a lesson</option>
                                    {(lessonsQuery.data || []).map((lesson) => (
                                        <option key={lesson.id} value={lesson.id}>
                                            {lesson.title}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.lessonId && <p className="text-xs text-red-600 mt-1">{formErrors.lessonId}</p>}
                                {!lessonsQuery.isLoading && resolvedCourseId && (lessonsQuery.data || []).length === 0 && (
                                    <p className="text-xs text-amber-700 mt-1">
                                        No lessons found in this course. Create a lesson first.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Input Format</label>
                                <textarea
                                    value={inputFormat}
                                    onChange={(event) => setInputFormat(event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 min-h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Describe input shape and constraints for parser."
                                    disabled={createMutation.isPending}
                                />
                                {formErrors.inputFormat && <p className="text-xs text-red-600 mt-1">{formErrors.inputFormat}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Output Format</label>
                                <textarea
                                    value={outputFormat}
                                    onChange={(event) => setOutputFormat(event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 min-h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Describe expected return/output format."
                                    disabled={createMutation.isPending}
                                />
                                {formErrors.outputFormat && <p className="text-xs text-red-600 mt-1">{formErrors.outputFormat}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Constraints</label>
                            <textarea
                                value={constraints}
                                onChange={(event) => setConstraints(event.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 min-h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="e.g. 1 <= n <= 10^5"
                                disabled={createMutation.isPending}
                            />
                            {formErrors.constraints && <p className="text-xs text-red-600 mt-1">{formErrors.constraints}</p>}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <PenSquare size={16} className="text-primary" />
                                <label className="block text-sm font-semibold text-gray-700">Description (Markdown Supported)</label>
                                <Eye size={16} className="text-secondary ml-2" />
                                <span className="text-xs text-secondary">Live preview</span>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 min-h-56 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="# Problem statement&#10;Describe objective, examples, and edge cases."
                                    disabled={createMutation.isPending}
                                />
                                <div
                                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 min-h-56 overflow-auto text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: markdownPreview }}
                                />
                            </div>
                            {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Starter Code</label>
                            <textarea
                                value={starterCode}
                                onChange={(event) => setStarterCode(event.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 min-h-44 font-mono text-sm bg-gray-950 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                disabled={createMutation.isPending}
                            />
                            {formErrors.starterCode && <p className="text-xs text-red-600 mt-1">{formErrors.starterCode}</p>}
                        </div>
                    </section>

                    <section className="card-premium space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Test Cases</h2>
                            <button
                                type="button"
                                onClick={() => setTestCases((current) => [...current, createTestCaseDraft()])}
                                disabled={createMutation.isPending}
                                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-all disabled:opacity-50"
                            >
                                <Plus size={16} />
                                Add Test Case
                            </button>
                        </div>

                        {formErrors.testCases && <p className="text-sm text-red-600">{formErrors.testCases}</p>}

                        <div className="space-y-4 max-h-[35rem] overflow-y-auto pr-1">
                            {testCases.map((testCase, index) => (
                                <article key={testCase.id} className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50/40">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-gray-800">Case {index + 1}</h3>
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs text-secondary font-semibold inline-flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={testCase.isHidden}
                                                    onChange={(event) => updateTestCase(testCase.id, 'isHidden', event.target.checked)}
                                                    disabled={createMutation.isPending}
                                                    className="rounded border-gray-300 text-primary focus:ring-primary/20"
                                                />
                                                Hidden
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => removeTestCase(testCase.id)}
                                                disabled={createMutation.isPending || testCases.length === 1}
                                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                                aria-label={`Remove test case ${index + 1}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Input</label>
                                            <textarea
                                                value={testCase.input}
                                                onChange={(event) => updateTestCase(testCase.id, 'input', event.target.value)}
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono min-h-20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                placeholder="Input for this case"
                                                disabled={createMutation.isPending}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Expected Output</label>
                                            <textarea
                                                value={testCase.expectedOutput}
                                                onChange={(event) => updateTestCase(testCase.id, 'expectedOutput', event.target.value)}
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono min-h-20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                placeholder="Expected output"
                                                disabled={createMutation.isPending}
                                            />
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="space-y-4">
                    <section className="card-premium space-y-3">
                        <h3 className="text-lg font-bold text-gray-900">Save Problem</h3>
                        <p className="text-sm text-secondary">
                            Problem metadata and test cases will be saved together and available for student submissions.
                        </p>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || !selectedLessonId}
                            className="w-full btn-gradient py-3.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Problem'
                            )}
                        </button>
                    </section>

                    {apiError && (
                        <section className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                            {apiError}
                        </section>
                    )}

                    {successMessage && (
                        <section className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 space-y-2">
                            <p className="font-semibold">{successMessage}</p>
                            {createdProblemId && (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/app/problem/${createdProblemId}`)}
                                    className="underline"
                                >
                                    Open problem page
                                </button>
                            )}
                            {selectedLessonId && (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/app/lesson/${selectedLessonId}`)}
                                    className="underline block"
                                >
                                    Back to lesson
                                </button>
                            )}
                        </section>
                    )}
                </aside>
            </form>
        </div>
    );
};

export default ProblemCreatePage;
