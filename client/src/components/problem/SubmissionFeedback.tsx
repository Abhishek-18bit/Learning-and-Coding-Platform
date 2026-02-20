import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Timer } from 'lucide-react';
import type { SubmissionStatus, SubmitSummary } from '../../services/problem.service';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface SubmissionFeedbackProps {
    canSubmit: boolean;
    executionError: string;
    summary: SubmitSummary | null;
}

const verdictVariant: Record<SubmissionStatus, 'success' | 'warning' | 'error' | 'muted'> = {
    ACCEPTED: 'success',
    WRONG_ANSWER: 'warning',
    ERROR: 'error',
    PENDING: 'muted',
};

const SubmissionFeedback = ({ canSubmit, executionError, summary }: SubmissionFeedbackProps) => {
    const isAccepted = summary?.finalVerdict === 'ACCEPTED';

    return (
        <Card variant="layered" className="min-h-48">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="typ-h3 !text-lg mb-0">Execution Result</h3>
                {summary && (
                    <motion.div
                        initial={{ scale: 0.94, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                    >
                        <Badge variant={verdictVariant[summary.finalVerdict]}>{summary.finalVerdict}</Badge>
                    </motion.div>
                )}
            </div>

            {!canSubmit && (
                <p className="mb-3 rounded-lg border border-warning/35 bg-warning/15 px-3 py-2 text-xs font-semibold text-warning">
                    Preview mode: only student accounts can submit.
                </p>
            )}

            <AnimatePresence mode="wait">
                {executionError ? (
                    <motion.p
                        key="execution-error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, x: [0, -8, 8, -6, 6, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                        className="mb-3 rounded-lg border border-error/35 bg-error/15 px-3 py-2 text-sm font-medium text-error"
                    >
                        <span className="inline-flex items-center gap-2">
                            <AlertTriangle size={15} />
                            {executionError}
                        </span>
                    </motion.p>
                ) : null}
            </AnimatePresence>

            {summary ? (
                <div className="space-y-3">
                    {isAccepted && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: [1, 1.02, 1] }}
                            transition={{ duration: 0.26, ease: 'easeInOut' }}
                            className="rounded-xl border border-success/35 bg-success/15 p-3"
                        >
                            <p className="inline-flex items-center gap-2 text-sm font-semibold text-success">
                                <CheckCircle2 size={16} />
                                Accepted. All checks passed successfully.
                            </p>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="rounded-lg border border-border bg-surface p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Passed</p>
                            <p className="text-xl font-bold text-gray-900">{summary.passedTestCount}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Failed</p>
                            <p className="text-xl font-bold text-gray-900">{summary.failedTestCount}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-3">
                            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
                                <Timer size={12} />
                                Execution Time
                            </p>
                            <p className="text-xl font-bold text-gray-900">{summary.executionTime} ms</p>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="typ-muted">Run your code or submit to view verdict and test summary.</p>
            )}
        </Card>
    );
};

export default SubmissionFeedback;
