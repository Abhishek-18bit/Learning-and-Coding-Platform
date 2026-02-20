import { motion } from 'framer-motion';
import { BookOpen, Layers } from 'lucide-react';

interface LessonListProps {
    lessonCount: number;
}

const LessonList = ({ lessonCount }: LessonListProps) => {
    if (lessonCount <= 0) {
        return (
            <div className="rounded-xl border border-border bg-surface/60 p-3">
                <p className="typ-muted">No lessons published yet.</p>
            </div>
        );
    }

    const visibleCount = Math.min(lessonCount, 3);

    return (
        <div className="rounded-xl border border-border bg-surface/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Layers size={15} className="text-primary-cyan" />
                <span>Lesson Structure</span>
            </div>
            <ul className="space-y-2">
                {Array.from({ length: visibleCount }).map((_, index) => (
                    <motion.li
                        key={`lesson-preview-${index + 1}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, delay: index * 0.04, ease: 'easeInOut' }}
                        className="flex items-center justify-between rounded-lg border border-border bg-card/70 px-3 py-2"
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen size={14} className="text-primary-blue" />
                            <span className="text-sm font-medium text-gray-700">Lesson {index + 1}</span>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Module</span>
                    </motion.li>
                ))}
                {lessonCount > visibleCount && (
                    <li className="text-xs font-semibold uppercase tracking-wide text-muted">
                        +{lessonCount - visibleCount} more lessons
                    </li>
                )}
            </ul>
        </div>
    );
};

export default LessonList;
