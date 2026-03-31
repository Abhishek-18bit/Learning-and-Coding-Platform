import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    Clock,
    Code,
    ExternalLink,
    Filter,
    History,
    Loader2,
    Radar,
    XCircle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { problemService } from '../services/problem.service';

const SubmissionHistoryPage = () => {
    const navigate = useNavigate();
    const { data: submissions, isLoading } = useQuery({
        queryKey: ['my-submissions'],
        queryFn: () => problemService.getMySubmissions(),
    });

    const summary = useMemo(() => {
        const rows = submissions || [];
        return {
            total: rows.length,
            accepted: rows.filter((item) => item.status === 'ACCEPTED').length,
            wrong: rows.filter((item) => item.status === 'WRONG_ANSWER').length,
            pending: rows.filter((item) => item.status === 'PENDING').length,
        };
    }, [submissions]);

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="typ-muted font-medium">Retrieving your coding history...</p>
            </div>
        );
    }

    return (
        <div className="mission-page">
            <section className="mission-shell p-6 lg:p-7">
                <div className="mission-shell-content flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <span className="mission-kicker">
                            <span className="mission-kicker-dot" />
                            Submission Ledger
                        </span>
                        <h1 className="mission-title mt-3">Global History</h1>
                        <p className="mission-subtitle">A chronological record of your coding attempts and verdicts.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mission-chip">
                            <Radar size={13} />
                            {summary.total} total attempts
                        </span>
                        <span className="mission-chip">
                            <CheckCircle size={13} />
                            {summary.accepted} accepted
                        </span>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Card variant="layered" className="p-4">
                    <p className="mission-metric-label">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                </Card>
                <Card variant="layered" className="p-4">
                    <p className="mission-metric-label">Accepted</p>
                    <p className="text-2xl font-bold text-success">{summary.accepted}</p>
                </Card>
                <Card variant="layered" className="p-4">
                    <p className="mission-metric-label">Wrong</p>
                    <p className="text-2xl font-bold text-warning">{summary.wrong}</p>
                </Card>
                <Card variant="layered" className="p-4">
                    <p className="mission-metric-label">Pending</p>
                    <p className="text-2xl font-bold text-primary-cyan">{summary.pending}</p>
                </Card>
            </section>

            <Card variant="glass" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mission-panel-title">Submission Table</p>
                        <h2 className="typ-h2 !text-2xl mb-1 mt-2">Recent execution outcomes</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="border border-border">
                            <Filter size={14} />
                            Filter Status
                        </Button>
                        <Button variant="secondary" size="sm">
                            <History size={14} />
                            Sync History
                        </Button>
                    </div>
                </div>

                {submissions && submissions.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full min-w-[760px] text-left">
                            <thead className="bg-card/85 border-b border-border">
                                <tr className="text-xs uppercase tracking-[0.14em] text-muted">
                                    <th className="px-4 py-3 font-semibold">Problem</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Language</th>
                                    <th className="px-4 py-3 font-semibold">Executed</th>
                                    <th className="px-4 py-3 font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/75 bg-surface/40">
                                {submissions.map((submission) => (
                                    <tr key={submission.id} className="hover:bg-surface transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-blue/15 text-primary-cyan">
                                                    <Code size={14} />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {submission.problem?.title || `Algorithm Task #${submission.id.slice(0, 4)}`}
                                                    </p>
                                                    <p className="text-xs text-muted">ID: {submission.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant={
                                                    submission.status === 'ACCEPTED'
                                                        ? 'success'
                                                        : submission.status === 'WRONG_ANSWER'
                                                          ? 'warning'
                                                          : submission.status === 'PENDING'
                                                            ? 'primary'
                                                            : 'error'
                                                }
                                            >
                                                {submission.status === 'ACCEPTED' ? (
                                                    <CheckCircle size={12} />
                                                ) : submission.status === 'PENDING' ? (
                                                    <Clock size={12} />
                                                ) : (
                                                    <XCircle size={12} />
                                                )}
                                                {submission.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold text-gray-700 uppercase">
                                                {submission.language}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-700">{new Date(submission.createdAt).toLocaleString()}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/app/problem/${submission.problemId}`)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-gray-700"
                                                title="Open Problem"
                                            >
                                                <ExternalLink size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Card variant="layered" className="py-14 text-center space-y-3">
                        <History size={52} className="mx-auto text-muted" />
                        <h3 className="typ-h3 !text-2xl mb-0">No submissions yet</h3>
                        <p className="typ-muted max-w-md mx-auto">
                            Start solving problems to build your submission timeline and performance records.
                        </p>
                        <div className="flex justify-center">
                            <Button variant="primary" onClick={() => navigate('/app/problems')}>
                                Browse Problems
                            </Button>
                        </div>
                    </Card>
                )}
            </Card>
        </div>
    );
};

export default SubmissionHistoryPage;
