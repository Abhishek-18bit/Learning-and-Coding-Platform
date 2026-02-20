import { useQuery } from '@tanstack/react-query';
import { History, CheckCircle, XCircle, Clock, ExternalLink, Filter, Loader2, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { problemService } from '../services/problem.service';

const SubmissionHistoryPage = () => {
    const navigate = useNavigate();
    const { data: submissions, isLoading } = useQuery({
        queryKey: ['my-submissions'],
        queryFn: () => problemService.getMySubmissions(),
    });

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-secondary font-medium">Retrieving your coding history...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-headlines">Global History</h1>
                    <p className="text-secondary mt-1 font-medium">A chronological record of every algorithm you've conquered.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-secondary hover:text-primary transition-all flex items-center gap-2">
                        <Filter size={18} />
                        Filter Status
                    </button>
                    <button className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
                        <History size={18} />
                        Sync History
                    </button>
                </div>
            </div>

            {/* Submissions List */}
            <div className="card-premium !p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Problem</th>
                                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Language</th>
                                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Executed</th>
                                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {submissions?.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-gray-100 rounded-xl text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                <Code size={18} />
                                            </div>
                                            <span className="font-bold text-gray-900">Algorithm Task #{sub.id.slice(0, 4)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div
                                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-tighter ${sub.status === 'ACCEPTED'
                                                ? 'bg-green-100 text-green-700'
                                                : sub.status === 'WRONG_ANSWER'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : sub.status === 'PENDING'
                                                        ? 'bg-slate-100 text-slate-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                        >
                                            {sub.status === 'ACCEPTED' ? (
                                                <CheckCircle size={14} />
                                            ) : sub.status === 'PENDING' ? (
                                                <Clock size={14} />
                                            ) : (
                                                <XCircle size={14} />
                                            )}
                                            {sub.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-sm font-bold text-secondary uppercase bg-gray-100 px-3 py-1 rounded-lg">
                                            {sub.language}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-sm text-secondary font-medium">
                                            <Clock size={16} />
                                            {new Date(sub.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <button className="p-2 text-gray-300 hover:text-primary transition-colors">
                                            <ExternalLink size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {(!submissions || submissions.length === 0) && (
                    <div className="py-20 text-center space-y-4">
                        <History size={60} className="mx-auto text-gray-100" />
                        <h3 className="text-xl font-bold text-gray-900">No submissions yet</h3>
                        <p className="text-secondary max-w-sm mx-auto">Start solving problems to build your global ranking and submission history.</p>
                        <button
                            onClick={() => navigate('/app/courses')}
                            className="btn-gradient inline-flex px-8 py-3"
                        >
                            Browse Problems
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubmissionHistoryPage;
