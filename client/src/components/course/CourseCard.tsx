import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, BookOpen, Clock3, Layers3, Sparkles, Target } from 'lucide-react';
import type { Course } from '../../services/course.service';
import Badge from '../ui/Badge';

interface CourseCardProps {
    course: Course;
    problemCount: number;
    progressPercent: number;
    onOpen: () => void;
}

const getProgressBadge = (progressPercent: number): { label: string; variant: 'success' | 'warning' | 'primary' } => {
    if (progressPercent >= 72) return { label: 'Advanced', variant: 'success' };
    if (progressPercent >= 42) return { label: 'Medium', variant: 'warning' };
    return { label: 'Beginner', variant: 'primary' };
};

const CourseCard = ({ course, problemCount, progressPercent, onOpen }: CourseCardProps) => {
    const lessonCount = course._count?.lessons || 0;
    const progressState = getProgressBadge(progressPercent);
    const estimatedHours = Math.max(12, lessonCount * 3 + Math.ceil(problemCount * 0.5));
    const keyTopics = Math.max(lessonCount + Math.ceil(problemCount * 0.6), 4);
    const sourceText = `${course.title} ${course.description || ''}`;
    const keywords = Array.from(
        new Set(
            sourceText
                .replace(/[^a-zA-Z0-9\s]/g, ' ')
                .split(/\s+/)
                .map((word) => word.trim())
                .filter((word) => word.length >= 5)
                .slice(0, 6)
        )
    ).slice(0, 3);
    const topicTags = keywords.length > 0 ? keywords : ['Concepts', 'Practice', 'Revision'];

    return (
        <motion.button
            whileHover={{ y: -5 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            type="button"
            onClick={onOpen}
            className="group relative flex h-full w-full flex-col overflow-hidden rounded-[1rem] border border-border/70 bg-card/92 p-4 text-left shadow-soft"
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_100%_at_8%_0%,rgba(168,85,247,0.06),rgba(168,85,247,0)_58%),radial-gradient(95%_100%_at_100%_0%,rgba(34,211,238,0.05),rgba(34,211,238,0)_52%)] opacity-60" />
            <div className="pointer-events-none absolute inset-0 opacity-26 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:22px_22px]" />

            <div className="relative z-10">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary-blue/18 bg-primary-blue/10 text-primary-cyan">
                        <BookOpen size={17} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={progressState.variant}>{progressState.label}</Badge>
                        <ArrowUpRight size={16} className="text-primary-cyan transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                </div>

                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-blue">Course Track</p>
                <h3 className="mb-1.5 line-clamp-2 text-[1.55rem] font-semibold leading-tight text-gray-900">{course.title}</h3>
                <p className="typ-muted line-clamp-2 min-h-[2.9rem] text-[0.86rem] leading-6">
                    {course.description || 'Structured sequence with focused theory, applied problem solving, and exam-oriented preparation.'}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                    {topicTags.map((topic) => (
                        <span
                            key={`${course.id}-${topic}`}
                            className="inline-flex items-center rounded-md border border-border/85 bg-surface/80 px-2 py-0.5 text-[10px] font-semibold text-gray-700"
                        >
                            {topic}
                        </span>
                    ))}
                </div>

                <div className="mt-3.5 border-t border-border/85 pt-2.5">
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted">
                        <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={12} />
                            {estimatedHours} hrs
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Layers3 size={12} />
                            {lessonCount} modules
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Target size={12} />
                            {keyTopics} topics
                        </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                            <Sparkles size={12} className="text-primary-cyan" />
                            {course.teacher?.name || 'Instructor'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary-cyan transition-transform duration-200 group-hover:translate-x-1">
                            Open
                            <ArrowRight size={14} />
                        </span>
                    </div>
                </div>
            </div>
        </motion.button>
    );
};

export default CourseCard;


