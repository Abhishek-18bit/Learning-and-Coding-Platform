import { Loader2, Play } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import type { ProblemTestCase, CustomRunResult } from '../../services/problem.service';

export interface TestcaseHistoryItem {
    id: string;
    label: string;
    input: string;
    expectedOutput: string;
    result: CustomRunResult;
    createdAt: string;
}

interface TestcasePlaygroundProps {
    input: string;
    expectedOutput: string;
    examples: ProblemTestCase[];
    isRunning: boolean;
    result: CustomRunResult | null;
    history: TestcaseHistoryItem[];
    selectedHistoryId: string | null;
    error: string;
    onInputChange: (value: string) => void;
    onExpectedOutputChange: (value: string) => void;
    onSelectHistory: (id: string) => void;
    onLoadHistory: (id: string) => void;
    onRun: () => void;
}

const TestcasePlayground = ({
    input,
    expectedOutput,
    examples,
    isRunning,
    result,
    history,
    selectedHistoryId,
    error,
    onInputChange,
    onExpectedOutputChange,
    onSelectHistory,
    onLoadHistory,
    onRun,
}: TestcasePlaygroundProps) => {
    const selectedHistory = history.find((entry) => entry.id === selectedHistoryId) || null;
    const displayResult = selectedHistory?.result || result;
    const displayInput = selectedHistory?.input ?? input;
    const displayExpected = selectedHistory?.expectedOutput ?? expectedOutput;
    const expectedProvided = displayExpected.trim().length > 0;

    const formatTime = (iso: string) => {
        const parsed = new Date(iso);
        if (Number.isNaN(parsed.getTime())) {
            return '--';
        }
        return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <Card variant="layered" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="typ-h3 !text-lg mb-0">Testcase Playground</h3>
                <div className="flex items-center gap-2">
                    <Badge variant="muted">Custom Input</Badge>
                    <button
                        type="button"
                        onClick={onRun}
                        disabled={isRunning || !input.trim()}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        {isRunning ? 'Running...' : 'Run Custom'}
                    </button>
                </div>
            </div>

            {examples.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {examples.map((example, index) => (
                        <button
                            key={example.id}
                            type="button"
                            onClick={() => {
                                onInputChange(example.input);
                                onExpectedOutputChange(example.expectedOutput || '');
                            }}
                            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs font-medium text-muted hover:bg-surface-elevated hover:text-gray-700"
                        >
                            Use Example {index + 1}
                        </button>
                    ))}
                </div>
            ) : null}

            {history.length > 0 ? (
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Run History</p>
                        {selectedHistory ? (
                            <button
                                type="button"
                                onClick={() => onLoadHistory(selectedHistory.id)}
                                className="rounded-lg border border-border bg-surface px-2 py-1 text-xs font-medium text-muted hover:bg-surface-elevated hover:text-gray-700"
                            >
                                Load Selected Input
                            </button>
                        ) : null}
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {history.map((entry) => {
                            const isActive = selectedHistoryId === entry.id;
                            return (
                                <button
                                    key={entry.id}
                                    type="button"
                                    onClick={() => onSelectHistory(entry.id)}
                                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                        isActive
                                            ? 'border-primary-blue/60 bg-primary-blue/20 text-primary-cyan'
                                            : 'border-border bg-surface text-muted hover:bg-surface-elevated hover:text-gray-700'
                                    }`}
                                >
                                    {entry.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="label-base">Input</label>
                    <textarea
                        value={input}
                        onChange={(event) => onInputChange(event.target.value)}
                        className="input-base min-h-[120px] resize-y font-code text-sm"
                        placeholder="Enter stdin input"
                    />
                </div>
                <div className="space-y-2">
                    <label className="label-base">Expected Output (optional)</label>
                    <textarea
                        value={expectedOutput}
                        onChange={(event) => onExpectedOutputChange(event.target.value)}
                        className="input-base min-h-[120px] resize-y font-code text-sm"
                        placeholder="Enter expected output"
                    />
                </div>
            </div>

            {error ? (
                <p className="rounded-lg border border-error/35 bg-error/15 px-3 py-2 text-sm text-error">
                    {error}
                </p>
            ) : null}

            {displayResult ? (
                <div className="space-y-3 rounded-xl border border-border bg-surface p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={displayResult.status === 'ERROR' ? 'error' : 'success'}>{displayResult.status}</Badge>
                        <Badge variant="muted">{displayResult.executionTime} ms</Badge>
                        {expectedProvided ? (
                            <Badge variant={displayResult.isMatch ? 'success' : 'warning'}>
                                {displayResult.isMatch ? 'Output Matched' : 'Output Mismatch'}
                            </Badge>
                        ) : null}
                        {selectedHistory ? <Badge variant="muted">{formatTime(selectedHistory.createdAt)}</Badge> : null}
                    </div>

                    <div className="rounded-lg border border-border bg-background p-3 font-code text-xs leading-5 text-gray-100">
                        <p className="text-muted">$ run --mode custom</p>
                        <p>&gt; stdin</p>
                        <pre className="whitespace-pre-wrap text-gray-100">{displayInput || '(empty)'}</pre>
                        <p className="mt-2">&gt; stdout</p>
                        <pre className="whitespace-pre-wrap text-gray-100">
                            {displayResult.output || '(empty)'}
                        </pre>
                        {displayResult.error ? (
                            <>
                                <p className="mt-2 text-error">&gt; error</p>
                                <pre className="whitespace-pre-wrap text-error">{displayResult.error}</pre>
                            </>
                        ) : null}
                    </div>

                    {displayResult.error ? (
                        <p className="text-sm text-error">{displayResult.error}</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted">Actual Output</p>
                                <pre className="mt-1 whitespace-pre-wrap rounded-lg border border-border bg-card p-2 font-code text-sm">
                                    {displayResult.output || '(empty)'}
                                </pre>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted">Expected Output</p>
                                <pre className="mt-1 whitespace-pre-wrap rounded-lg border border-border bg-card p-2 font-code text-sm">
                                    {expectedProvided ? displayExpected : '(not provided)'}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </Card>
    );
};

export default TestcasePlayground;
