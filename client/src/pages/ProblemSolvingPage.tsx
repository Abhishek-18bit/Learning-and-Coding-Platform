import { useEffect, useMemo, useRef, useState, type WheelEvent as ReactWheelEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Editor, { type OnMount } from '@monaco-editor/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    Clock3,
    FlaskConical,
    ListChecks,
    Loader2,
    MessageSquareText,
    Play,
    Send,
    Terminal,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { type CustomRunResult, type SubmitSummary, problemService } from '../services/problem.service';
import Card from '../components/ui/Card';
import ProblemLayout from '../components/problem/ProblemLayout';
import SubmissionFeedback from '../components/problem/SubmissionFeedback';
import TestcasePlayground, { type TestcaseHistoryItem } from '../components/problem/TestcasePlayground';
import ContextChatPanel from '../components/chat/ContextChatPanel';

const SUPPORTED_RUN_LANGUAGES = new Set(['javascript', 'js', 'cpp', 'c++']);

type ProblemTab = 'description' | 'formats' | 'examples';
type WorkspaceDockTab = 'testcases' | 'results' | 'discussion';
type SupportedEditorLanguage = 'javascript' | 'cpp';

const resolveEditorLanguage = (value: string): SupportedEditorLanguage => {
    const normalized = String(value || '').toLowerCase().trim();
    return normalized === 'cpp' || normalized === 'c++' ? 'cpp' : 'javascript';
};

const LANGUAGE_CONFIG: Record<
    SupportedEditorLanguage,
    { label: string; monaco: 'javascript' | 'cpp'; fileName: string; defaultCode: string }
> = {
    javascript: {
        label: 'JavaScript',
        monaco: 'javascript',
        fileName: 'main.js',
        defaultCode: 'function solve(input) {\n  // Write your code here\n  return input;\n}',
    },
    cpp: {
        label: 'C++',
        monaco: 'cpp',
        fileName: 'main.cpp',
        defaultCode:
            '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // Write your code here\n\n    return 0;\n}\n',
    },
};

const ProblemSolvingPage = () => {
    const { problemId } = useParams<{ problemId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [language, setLanguage] = useState<SupportedEditorLanguage>('javascript');
    const [codeByLanguage, setCodeByLanguage] = useState<Record<SupportedEditorLanguage, string>>({
        javascript: LANGUAGE_CONFIG.javascript.defaultCode,
        cpp: LANGUAGE_CONFIG.cpp.defaultCode,
    });
    const [hasEditedCodeByLanguage, setHasEditedCodeByLanguage] = useState<
        Record<SupportedEditorLanguage, boolean>
    >({
        javascript: false,
        cpp: false,
    });
    const [lastSummary, setLastSummary] = useState<SubmitSummary | null>(null);
    const [lastAction, setLastAction] = useState<'run' | 'submit' | null>(null);
    const [executionError, setExecutionError] = useState('');
    const [activeTab, setActiveTab] = useState<ProblemTab>('description');
    const [customInput, setCustomInput] = useState('');
    const [customExpectedOutput, setCustomExpectedOutput] = useState('');
    const [customRunResult, setCustomRunResult] = useState<CustomRunResult | null>(null);
    const [customRunError, setCustomRunError] = useState('');
    const [customRunHistory, setCustomRunHistory] = useState<TestcaseHistoryItem[]>([]);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const [activeDockTab, setActiveDockTab] = useState<WorkspaceDockTab>('testcases');
    const customCaseCounterRef = useRef(0);
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
    const editorContainerRef = useRef<HTMLDivElement | null>(null);
    const [editorReady, setEditorReady] = useState(false);
    const [fallbackEditorEnabled, setFallbackEditorEnabled] = useState(false);

    const { data: problem, isLoading, isError } = useQuery({
        queryKey: ['problem', problemId],
        queryFn: () => problemService.getProblemById(problemId!),
        enabled: Boolean(problemId),
    });

    const activeLanguageConfig = LANGUAGE_CONFIG[language];
    const code = codeByLanguage[language];

    const getDefaultCodeForLanguage = (targetLanguage: SupportedEditorLanguage) => {
        if (targetLanguage === 'javascript' && problem?.starterCode?.trim()) {
            return problem.starterCode;
        }
        return LANGUAGE_CONFIG[targetLanguage].defaultCode;
    };

    useEffect(() => {
        setLanguage('javascript');
        setCodeByLanguage({
            javascript: problem?.starterCode?.trim()
                ? problem.starterCode
                : LANGUAGE_CONFIG.javascript.defaultCode,
            cpp: LANGUAGE_CONFIG.cpp.defaultCode,
        });
        setHasEditedCodeByLanguage({
            javascript: false,
            cpp: false,
        });
    }, [problemId]);

    useEffect(() => {
        if (!problem?.starterCode?.trim() || hasEditedCodeByLanguage.javascript) {
            return;
        }

        setCodeByLanguage((current) => ({
            ...current,
            javascript: problem.starterCode,
        }));
    }, [problem?.starterCode, hasEditedCodeByLanguage.javascript]);

    useEffect(() => {
        setCodeByLanguage((current) => {
            const currentCode = current[language];
            if (typeof currentCode === 'string' && currentCode.length > 0) {
                return current;
            }
            if (hasEditedCodeByLanguage[language]) {
                return current;
            }

            return {
                ...current,
                [language]: getDefaultCodeForLanguage(language),
            };
        });
    }, [language, hasEditedCodeByLanguage, problem?.starterCode]);

    useEffect(() => {
        if (editorReady) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setFallbackEditorEnabled(true);
        }, 6000);

        return () => window.clearTimeout(timeoutId);
    }, [editorReady]);

    useEffect(() => {
        if (!editorContainerRef.current) {
            return;
        }

        const observer = new ResizeObserver(() => {
            editorRef.current?.layout();
        });

        observer.observe(editorContainerRef.current);
        return () => observer.disconnect();
    }, []);

    const handleEditorWheelCapture = (event: ReactWheelEvent<HTMLDivElement>) => {
        if (!editorRef.current || !editorReady || showFallbackEditor) {
            return;
        }

        const editor = editorRef.current;
        const horizontalDelta = event.shiftKey ? event.deltaY : event.deltaX;

        if (Math.abs(horizontalDelta) > Math.abs(event.deltaY)) {
            editor.setScrollLeft(editor.getScrollLeft() + horizontalDelta);
        } else {
            editor.setScrollTop(editor.getScrollTop() + event.deltaY);
        }

        event.preventDefault();
        event.stopPropagation();
    };

    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        window.requestAnimationFrame(() => {
            editorRef.current?.layout();
            editorRef.current?.setScrollTop(0);
            editorRef.current?.setScrollLeft(0);
            editorRef.current?.focus();
        });
    }, [language]);

    const handleEditorMount: OnMount = (editorInstance) => {
        editorRef.current = editorInstance;
        setEditorReady(true);
        setFallbackEditorEnabled(false);

        window.requestAnimationFrame(() => {
            const currentValue = editorInstance.getValue();
            if (!currentValue.trim()) {
                const fallbackCode = code || getDefaultCodeForLanguage(language);
                editorInstance.setValue(fallbackCode);
                setCodeByLanguage((current) => ({
                    ...current,
                    [language]: fallbackCode,
                }));
            }
            editorInstance.layout();
            editorInstance.focus();
        });
    };

    const executeMutation = useMutation({
        mutationFn: (_action: 'run' | 'submit') => problemService.submitByProblemId(problemId!, language, code),
        onSuccess: (result, action) => {
            setLastSummary(result.summary);
            setLastAction(action);
            setExecutionError('');
            setActiveDockTab('results');
            if (action === 'submit') {
                queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
                queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
            }
        },
        onError: (error) => {
            const axiosError = error as AxiosError<{ message?: string }>;
            setExecutionError(axiosError.response?.data?.message || 'Execution failed. Please try again.');
            setActiveDockTab('results');
        },
    });

    const runCustomMutation = useMutation({
        mutationFn: () =>
            problemService.runCustomByProblemId(
                problemId!,
                language,
                code,
                customInput,
                customExpectedOutput.trim() ? customExpectedOutput : undefined
            ),
        onSuccess: (result) => {
            setCustomRunResult(result);
            setCustomRunError('');
            setActiveDockTab('testcases');

            customCaseCounterRef.current += 1;
            const nextEntry: TestcaseHistoryItem = {
                id: `case-${Date.now()}-${customCaseCounterRef.current}`,
                label: `Case ${customCaseCounterRef.current}`,
                input: customInput,
                expectedOutput: customExpectedOutput,
                result,
                createdAt: new Date().toISOString(),
            };

            setCustomRunHistory((prev) => [nextEntry, ...prev].slice(0, 12));
            setSelectedHistoryId(nextEntry.id);
        },
        onError: (error) => {
            const axiosError = error as AxiosError<{ message?: string }>;
            setCustomRunError(axiosError.response?.data?.message || 'Custom execution failed.');
            setActiveDockTab('testcases');
        },
    });

    const visibleExamples = useMemo(
        () => (problem?.testCases || []).filter((testCase) => !testCase.isHidden).slice(0, 3),
        [problem?.testCases]
    );

    useEffect(() => {
        if (!visibleExamples.length || customInput.trim()) {
            return;
        }
        setCustomInput(visibleExamples[0].input);
        setCustomExpectedOutput(visibleExamples[0].expectedOutput || '');
    }, [customInput, visibleExamples]);

    const canSubmit = user?.role === 'STUDENT';
    const isExecuting = executeMutation.isPending;
    const showFallbackEditor = fallbackEditorEnabled && !editorReady;
    const codeLineCount = useMemo(() => code.split('\n').length, [code]);
    const codeCharCount = code.length;

    const handleLanguageChange = (nextValue: string) => {
        setLanguage(resolveEditorLanguage(nextValue));
    };

    const onExecute = (action: 'run' | 'submit') => {
        setExecutionError('');
        setLastAction(action);

        if (!problemId) return;
        if (!SUPPORTED_RUN_LANGUAGES.has(language.toLowerCase())) {
            setExecutionError('Supported languages: JavaScript and C++.');
            return;
        }
        if (!code.trim()) {
            setExecutionError('Code cannot be empty.');
            return;
        }
        if (action === 'submit' && !canSubmit) {
            setExecutionError('Only students can submit solutions.');
            return;
        }

        executeMutation.mutate(action);
    };

    const onRunCustom = () => {
        setCustomRunError('');
        setCustomRunResult(null);

        if (!problemId) return;
        if (!SUPPORTED_RUN_LANGUAGES.has(language.toLowerCase())) {
            setCustomRunError('Supported languages: JavaScript and C++.');
            return;
        }
        if (!code.trim()) {
            setCustomRunError('Code cannot be empty.');
            return;
        }
        if (!customInput.trim()) {
            setCustomRunError('Input is required for custom run.');
            return;
        }

        runCustomMutation.mutate();
    };

    const onSelectHistory = (id: string) => {
        setSelectedHistoryId(id);
    };

    const onLoadHistory = (id: string) => {
        const entry = customRunHistory.find((item) => item.id === id);
        if (!entry) {
            return;
        }
        setSelectedHistoryId(id);
        setCustomInput(entry.input);
        setCustomExpectedOutput(entry.expectedOutput);
        setCustomRunResult(entry.result);
    };

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="typ-muted font-medium">Loading problem...</p>
            </div>
        );
    }

    if (isError || !problem) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-center">
                <AlertTriangle className="w-14 h-14 text-error" />
                <h2 className="typ-h2 !text-2xl mb-0">Problem unavailable</h2>
                <p className="typ-muted">Unable to load this coding problem right now.</p>
                <button onClick={() => navigate(-1)} className="btn-gradient px-6 py-3">
                    Go Back
                </button>
            </div>
        );
    }

    const tabs = [
        { key: 'description', label: 'Description' },
        { key: 'formats', label: 'Input / Output' },
        { key: 'examples', label: 'Examples' },
    ];

    const dockTabs = [
        {
            key: 'testcases' as const,
            label: 'Testcases',
            icon: FlaskConical,
            badge: customRunHistory.length > 0 ? String(customRunHistory.length) : null,
        },
        {
            key: 'results' as const,
            label: 'Results',
            icon: ListChecks,
            badge: lastSummary || executionError ? 'LIVE' : null,
        },
        {
            key: 'discussion' as const,
            label: 'Discussion',
            icon: MessageSquareText,
            badge: null,
        },
    ];

    return (
        <ProblemLayout
            title={problem.title}
            difficulty={problem.difficulty}
            onBack={() => navigate(-1)}
            meta={
                <span className="typ-muted inline-flex items-center gap-1">
                    <Clock3 size={12} />
                    Timed judge execution
                </span>
            }
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as ProblemTab)}
            descriptionToolbar={
                <div className="flex flex-wrap items-center gap-1.5">
                    {dockTabs.map((tabItem) => {
                        const Icon = tabItem.icon;
                        const isActive = activeDockTab === tabItem.key;

                        return (
                            <button
                                key={tabItem.key}
                                type="button"
                                onClick={() => setActiveDockTab(tabItem.key)}
                                title={tabItem.label}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.01em] transition ${
                                    isActive
                                        ? 'border-primary-blue/55 bg-primary-blue/20 text-primary-cyan'
                                        : 'border-border bg-surface text-muted hover:text-gray-700'
                                }`}
                            >
                                <Icon size={12} />
                                {tabItem.label}
                                {tabItem.badge ? (
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                            isActive
                                                ? 'bg-primary-cyan/15 text-primary-cyan'
                                                : 'bg-card text-muted'
                                        }`}
                                    >
                                        {tabItem.badge}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            }
            descriptionContent={
                <AnimatePresence mode="wait">
                    <motion.article
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="space-y-6 text-sm leading-relaxed"
                    >
                        {activeTab === 'description' && (
                            <>
                                <section>
                                    <h2 className="typ-h3 !text-base mb-2">Description</h2>
                                    <p className="typ-body whitespace-pre-wrap">{problem.description}</p>
                                </section>
                                <section>
                                    <h2 className="typ-h3 !text-base mb-2">Constraints</h2>
                                    <p className="typ-body whitespace-pre-wrap">{problem.constraints}</p>
                                </section>
                            </>
                        )}

                        {activeTab === 'formats' && (
                            <>
                                <section>
                                    <h2 className="typ-h3 !text-base mb-2">Input Format</h2>
                                    <p className="typ-body whitespace-pre-wrap">{problem.inputFormat}</p>
                                </section>
                                <section>
                                    <h2 className="typ-h3 !text-base mb-2">Output Format</h2>
                                    <p className="typ-body whitespace-pre-wrap">{problem.outputFormat}</p>
                                </section>
                                <section>
                                    <h2 className="typ-h3 !text-base mb-2">Constraints</h2>
                                    <p className="typ-body whitespace-pre-wrap">{problem.constraints}</p>
                                </section>
                            </>
                        )}

                        {activeTab === 'examples' && (
                            <section>
                                <h2 className="typ-h3 !text-base mb-3">Example Test Cases</h2>
                                {visibleExamples.length > 0 ? (
                                    <div className="space-y-3">
                                        {visibleExamples.map((testCase, index) => (
                                            <Card key={testCase.id} variant="glass" className="p-4">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                                                    Example {index + 1}
                                                </p>
                                                <div className="typ-code space-y-2 !bg-transparent !border-0 !p-0">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                                            Input
                                                        </p>
                                                        <pre className="whitespace-pre-wrap">{testCase.input}</pre>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                                            Expected Output
                                                        </p>
                                                        <pre className="whitespace-pre-wrap">
                                                            {testCase.expectedOutput || 'Hidden'}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card variant="glass" className="p-4 text-muted">
                                        No public example test cases available yet.
                                    </Card>
                                )}
                            </section>
                        )}
                    </motion.article>
                </AnimatePresence>
            }
            editorContent={
                <Card variant="layered" tilt={false} className="!p-0 h-full min-h-0 overflow-hidden flex flex-col">
                    <div className="border-b border-border bg-surface/65 px-4 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <span className="rounded-md border border-primary-blue/45 bg-primary-blue/10 px-2.5 py-1 text-xs font-semibold text-primary-cyan">
                                    {activeLanguageConfig.fileName}
                                </span>
                                <span className="mission-chip !px-2.5 !py-1 !text-[11px]">
                                    {canSubmit ? 'Submission enabled' : 'Preview mode'}
                                </span>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{problem.difficulty} challenge</span>
                        </div>
                    </div>

                    <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-card/75">
                        <div className="mission-panel-title">
                            <Terminal size={14} />
                            Editor Controls
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={language}
                                onChange={(event) => handleLanguageChange(event.target.value)}
                                className="rounded-lg border border-border px-3 py-2 text-sm bg-surface text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-blue/30"
                                disabled={isExecuting}
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="cpp">C++</option>
                            </select>
                            <button
                                type="button"
                                onClick={() => onExecute('run')}
                                disabled={isExecuting}
                                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExecuting && lastAction === 'run' ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Play size={16} />
                                )}
                                Run
                            </button>
                            <button
                                type="button"
                                onClick={() => onExecute('submit')}
                                disabled={isExecuting || !canSubmit}
                                className="btn-gradient px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                            >
                                {isExecuting && lastAction === 'submit' ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
                                Submit
                            </button>
                        </div>
                    </div>

                    <div
                        ref={editorContainerRef}
                        onWheelCapture={handleEditorWheelCapture}
                        className="relative min-h-[20rem] h-full flex-1 overflow-hidden bg-background"
                    >
                        {!showFallbackEditor ? (
                            <Editor
                                key={`problem-editor-${problemId}-${language}`}
                                height="100%"
                                path={activeLanguageConfig.fileName}
                                language={activeLanguageConfig.monaco}
                                value={code}
                                onMount={handleEditorMount}
                                onChange={(nextValue) => {
                                    if (typeof nextValue !== 'string') {
                                        return;
                                    }
                                    setCodeByLanguage((current) => ({
                                        ...current,
                                        [language]: nextValue,
                                    }));
                                    setHasEditedCodeByLanguage((current) => ({
                                        ...current,
                                        [language]: true,
                                    }));
                                }}
                                loading={
                                    <div className="flex h-full items-center justify-center text-sm text-muted">
                                        Loading editor...
                                    </div>
                                }
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                                    fontSize: 14,
                                    lineNumbers: 'on',
                                    automaticLayout: true,
                                    scrollBeyondLastLine: false,
                                    scrollbar: {
                                        vertical: 'auto',
                                        horizontal: 'auto',
                                        verticalScrollbarSize: 10,
                                        horizontalScrollbarSize: 10,
                                        alwaysConsumeMouseWheel: true,
                                        handleMouseWheel: true,
                                        useShadows: false,
                                    },
                                    mouseWheelScrollSensitivity: 1,
                                    fastScrollSensitivity: 5,
                                    scrollPredominantAxis: false,
                                    overviewRulerLanes: 0,
                                    wordWrap: 'off',
                                    renderLineHighlight: 'all',
                                    smoothScrolling: true,
                                    cursorBlinking: 'expand',
                                    padding: { top: 12, bottom: 16 },
                                }}
                            />
                        ) : (
                            <textarea
                                value={code}
                                onChange={(event) => {
                                    setCodeByLanguage((current) => ({
                                        ...current,
                                        [language]: event.target.value,
                                    }));
                                    setHasEditedCodeByLanguage((current) => ({
                                        ...current,
                                        [language]: true,
                                    }));
                                }}
                                className="absolute inset-0 h-full w-full resize-none overflow-auto border-0 bg-background p-4 font-code text-sm leading-6 text-gray-100 focus:outline-none"
                                spellCheck={false}
                            />
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between border-t border-border bg-surface/65 px-4 py-2 text-xs text-muted">
                        <div className="flex items-center gap-2">
                            <span className="rounded-md border border-border bg-card px-2 py-1 font-semibold text-gray-700">
                                {language.toUpperCase()}
                            </span>
                            <span>{codeLineCount} lines</span>
                            <span>{codeCharCount} chars</span>
                            {showFallbackEditor ? (
                                <span className="rounded-md border border-warning/35 bg-warning/15 px-2 py-1 text-warning">
                                    Fallback editor
                                </span>
                            ) : null}
                        </div>
                        <span>Autosave in session memory</span>
                    </div>
                </Card>
            }
            feedbackContent={
                <div className="h-full min-h-0 flex flex-col gap-3">
                    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                        {activeDockTab === 'testcases' ? (
                            <TestcasePlayground
                                input={customInput}
                                expectedOutput={customExpectedOutput}
                                examples={visibleExamples}
                                isRunning={runCustomMutation.isPending}
                                result={customRunResult}
                                history={customRunHistory}
                                selectedHistoryId={selectedHistoryId}
                                error={customRunError}
                                onInputChange={setCustomInput}
                                onExpectedOutputChange={setCustomExpectedOutput}
                                onSelectHistory={onSelectHistory}
                                onLoadHistory={onLoadHistory}
                                onRun={onRunCustom}
                            />
                        ) : null}

                        {activeDockTab === 'results' ? (
                            <SubmissionFeedback
                                canSubmit={canSubmit}
                                executionError={executionError}
                                summary={lastSummary}
                            />
                        ) : null}

                        {activeDockTab === 'discussion' ? (
                            <ContextChatPanel
                                contextType="PROBLEM"
                                contextId={problem.id}
                                title="Problem Chat"
                                subtitle="Share hints and discuss strategy."
                                className="min-h-[420px]"
                            />
                        ) : null}
                    </div>
                </div>
            }
        />
    );
};

export default ProblemSolvingPage;
