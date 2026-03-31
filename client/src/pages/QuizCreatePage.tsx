import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ChevronLeft, Loader2, ClipboardCheck, Clock, Award } from 'lucide-react';
import { quizService } from '../services/quiz.service';

const QuizCreatePage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [title, setTitle] = useState('');
    const [timeLimit, setTimeLimit] = useState(30);
    const [totalMarks, setTotalMarks] = useState(100);

    const mutation = useMutation({
        mutationFn: () => quizService.create({
            title,
            courseId: courseId!,
            timeLimit,
            totalMarks
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
            navigate(`/app/course/${courseId}`);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && courseId) {
            mutation.mutate();
        }
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
                    <h1 className="text-3xl font-bold text-gray-900 font-headlines">Configure New Quiz</h1>
                    <p className="text-secondary mt-1">Set the parameters for your student assessment.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="card-premium space-y-8 !p-10">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">Assessment Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Mid-Term Proficiency Quiz"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-gray-50 rounded-2xl outline-none transition-all font-bold text-xl text-gray-900 placeholder:text-muted"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 text-center p-8 bg-gray-50 rounded-[2rem] border border-transparent hover:border-primary/20 transition-all">
                                <Clock size={40} className="mx-auto text-primary opacity-40 mb-2" />
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest leading-loose">Time Limit (Mins)</label>
                                <input
                                    type="number"
                                    value={timeLimit}
                                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                    className="w-full bg-transparent text-center text-4xl font-black text-gray-900 outline-none"
                                />
                            </div>
                            <div className="space-y-4 text-center p-8 bg-gray-50 rounded-[2rem] border border-transparent hover:border-primary/20 transition-all">
                                <Award size={40} className="mx-auto text-primary opacity-40 mb-2" />
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest leading-loose">Total Marks</label>
                                <input
                                    type="number"
                                    value={totalMarks}
                                    onChange={(e) => setTotalMarks(parseInt(e.target.value))}
                                    className="w-full bg-transparent text-center text-4xl font-black text-gray-900 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card-premium bg-gray-900 text-white !border-none !p-8">
                        <ClipboardCheck className="text-primary mb-4" size={32} />
                        <h3 className="font-bold text-lg mb-2">Quiz Setup</h3>
                        <p className="text-sm text-white/50 font-medium">Once created, you can add questions individually from the assessment manager.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={mutation.isPending || !title}
                        className="w-full btn-gradient py-5 text-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                        Initialize Quiz
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuizCreatePage;
