import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Editor from '@monaco-editor/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Clock3, Loader2, Play, Send, Terminal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { type SubmitSummary, problemService } from '../services/problem.service';
import Card from '../components/ui/Card';
import ProblemLayout from '../components/problem/ProblemLayout';
import SubmissionFeedback from '../components/problem/SubmissionFeedback';
import ContextChatPanel from '../components/chat/ContextChatPanel';

const SUPPORTED_RUN_LANGUAGES = new Set(['javascript', 'js']);

type ProblemTab = 'description' | 'formats' | 'examples';

const ProblemSolvingPage = () => {
    const { problemId } = useParams<{ problemId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('function solve(input) {\n  // Start coding here\n  return input;\n}');
    const [hasEditedCode, setHasEditedCode] = useState(false);
    const [lastSummary, setLastSummary] = useState<SubmitSummary | null>(null);
    const [lastAction, setLastAction] = useState<'run' | 'submit' | null>(null);
    const [executionError, setExecutionError] = useState('');
    const [activeTab, setActiveTab] = useState<ProblemTab>('description');

    const { data: problem, isLoading, isError } = useQuery({
        queryKey: ['problem', problemId],
        queryFn: () => problemService.getProblemById(problemId!),
        enabled: Boolean(problemId),
    });

    useEffect(() => {
        if (problem?.starterCode && !hasEditedCode) {
            setCode(problem.starterCode);
        }
    }, [problem?.starterCode, hasEditedCode]);

    const executeMutation = useMutation({
        mutationFn: (_action: 'run' | 'submit') => problemService.submitByProblemId(problemId!, language, code),
        onSuccess: (result, action) => {
            setLastSummary(result.summary);
            setLastAction(action);
            setExecutionError('');
            if (action === 'submit') {
                queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
                queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
            }
        },
        onError: (error) => {
            const axiosError = error as AxiosError<{ message?: string }>;
            setExecutionError(axiosError.response?.data?.message || 'Execution failed. Please try again.');
        },
    });

    const visibleExamples = useMemo(
        () => (problem?.testCases || []).filter((testCase) => !testCase.isHidden).slice(0, 3),
        [problem?.testCases]
    );

    const canSubmit = user?.role === 'STUDENT';
    const isExecuting = executeMutation.isPending;

    const onExecute = (action: 'run' | 'submit') => {
        setExecutionError('');
        setLastAction(action);

        if (!problemId) return;
        if (!SUPPORTED_RUN_LANGUAGES.has(language.toLowerCase())) {
            setExecutionError('Currently only JavaScript execution is available. Please select JavaScript.');
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
                <Card variant="layered" className="!p-0 min-h-0 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 text-xs text-muted font-semibold uppercase tracking-wider">
                            <Terminal size={14} />
                            Editor
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={language}
                                onChange={(event) => setLanguage(event.target.value)}
                                className="rounded-lg border border-border px-3 py-2 text-sm bg-surface text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-blue/30"
                                disabled={isExecuting}
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="typescript">TypeScript</option>
                                <option value="python">Python</option>
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

                    <div className="min-h-[22rem] flex-1 bg-background">
                        <Editor
                            height="100%"
                            language={
                                language === 'typescript'
                                    ? 'typescript'
                                    : language === 'python'
                                    ? 'python'
                                    : 'javascript'
                            }
                            value={code}
                            onChange={(nextValue) => {
                                setCode(nextValue || '');
                                setHasEditedCode(true);
                            }}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontFamily: 'Fira Code, monospace',
                                fontSize: 14,
                                lineNumbers: 'on',
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                padding: { top: 12, bottom: 12 },
                            }}
                        />
                    </div>
                </Card>
            }
            feedbackContent={
                <div className="space-y-4">
                    <SubmissionFeedback canSubmit={canSubmit} executionError={executionError} summary={lastSummary} />
                    <ContextChatPanel
                        contextType="PROBLEM"
                        contextId={problem.id}
                        title="Problem Chat"
                        subtitle="Share hints and discuss strategy."
                    />
                </div>
            }
        />
    );
};

export default ProblemSolvingPage;
