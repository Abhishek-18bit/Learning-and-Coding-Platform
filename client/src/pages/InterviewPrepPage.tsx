import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, CheckCircle, ChevronRight, Loader2, BookOpen, Terminal, Database, Layout } from 'lucide-react';
import { motion } from 'framer-motion';
import { interviewService } from '../services/interview.service';
import { fadeIn, staggerContainer } from '../animations/variants';

const InterviewPrepPage = () => {
    const queryClient = useQueryClient();
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: questions, isLoading } = useQuery({
        queryKey: ['interview-questions', activeCategory, searchQuery],
        queryFn: () => interviewService.getAll(activeCategory === 'All' ? undefined : activeCategory, searchQuery),
    });

    const completeMutation = useMutation({
        mutationFn: (id: string) => interviewService.markCompleted(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
        }
    });

    const categories = [
        { name: 'All', icon: <Filter size={18} /> },
        { name: 'Frontend', icon: <Layout size={18} /> },
        { name: 'Backend', icon: <Terminal size={18} /> },
        { name: 'Database', icon: <Database size={18} /> },
        { name: 'System Design', icon: <BookOpen size={18} /> },
    ];

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-10"
        >
            {/* Hero Header */}
            <motion.div
                variants={fadeIn}
                className="relative rounded-[2.5rem] bg-gray-900 p-12 overflow-hidden text-white shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent"></div>
                <div className="relative z-10 max-w-2xl space-y-6">
                    <h1 className="text-5xl font-extrabold tracking-tight font-headlines">Interview Arsenal</h1>
                    <p className="text-xl text-white/60 leading-relaxed">Master the most frequently asked industry questions across full-stack engineering, databases, and system design.</p>

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center font-bold text-xs">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm font-medium text-white/40">Joined by 12,000+ candidates this week</p>
                    </div>
                </div>
            </motion.div>

            {/* Filters & Search */}
            <motion.div
                variants={fadeIn}
                className="flex flex-col lg:flex-row gap-6 items-center justify-between"
            >
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => setActiveCategory(cat.name)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeCategory === cat.name
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-gray-50 text-secondary hover:bg-gray-100'
                                }`}
                        >
                            {cat.icon}
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl shadow-soft outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                    />
                </div>
            </motion.div>

            {/* Questions Grid */}
            <motion.div
                variants={staggerContainer}
                className="grid grid-cols-1 gap-6"
            >
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-secondary font-medium">Equipping your arsenal...</p>
                    </div>
                ) : questions?.map((q) => (
                    <motion.div
                        key={q.id}
                        variants={fadeIn}
                        whileHover={{ x: 5 }}
                        className="card-premium group hover:border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all cursor-pointer"
                    >
                        <div className="flex items-start gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${q.completed ? 'bg-green-100 text-green-600' : 'bg-primary/5 text-primary'
                                }`}>
                                {q.completed ? <CheckCircle size={28} /> : <BookOpen size={28} />}
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary/60">{q.category}</span>
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{q.title}</h3>
                                <p className="text-sm text-secondary line-clamp-1 max-w-2xl">{q.content}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {!q.completed && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        completeMutation.mutate(q.id);
                                    }}
                                    disabled={completeMutation.isPending}
                                    className="px-6 py-2 rounded-xl text-sm font-bold bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600 transition-all"
                                >
                                    Mark Solved
                                </button>
                            )}
                            <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {questions?.length === 0 && (
                <motion.div variants={fadeIn} className="py-20 text-center card-premium border-none space-y-4">
                    <Search size={48} className="mx-auto text-gray-200" />
                    <h3 className="text-xl font-bold">No results found</h3>
                    <p className="text-secondary">Try adjusting your filters or search terms.</p>
                </motion.div>
            )}
        </motion.div>
    );
};

export default InterviewPrepPage;
