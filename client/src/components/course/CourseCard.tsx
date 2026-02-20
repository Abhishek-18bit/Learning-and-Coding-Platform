import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, UserRound } from 'lucide-react';
import type { Course } from '../../services/course.service';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import LessonList from './LessonList';

interface CourseCardProps {
    course: Course;
    problemCount: number;
    progressPercent: number;
    onOpen: () => void;
}

const getProgressBadge = (progressPercent: number): { label: string; variant: 'success' | 'warning' | 'primary' } => {
    if (progressPercent >= 80) return { label: 'High Completion', variant: 'success' };
    if (progressPercent >= 45) return { label: 'In Progress', variant: 'warning' };
    return { label: 'Getting Started', variant: 'primary' };
};

const CourseCard = ({ course, problemCount, progressPercent, onOpen }: CourseCardProps) => {
    const lessonCount = course._count?.lessons || 0;
    const teacherInitial = (course.teacher?.name || 'T').charAt(0).toUpperCase();
    const progressState = getProgressBadge(progressPercent);

    return (
        <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="h-full">
            <Card
                variant="layered"
                hoverLift
                onClick={onOpen}
                className="group relative h-full cursor-pointer overflow-hidden p-0"
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_55%)] opacity-70" />

                <div className="relative z-10 flex h-full flex-col">
                    <div className="border-b border-border p-5">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-blue/15 text-primary-cyan">
                                <BookOpen size={22} />
                            </div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.24, ease: 'easeInOut' }}
                            >
                                <Badge variant={progressState.variant}>{progressState.label}</Badge>
                            </motion.div>
                        </div>

                        <h3 className="typ-h3 !text-xl mb-2 line-clamp-1">{course.title}</h3>
                        <p className="typ-muted line-clamp-2 min-h-12">
                            {course.description ||
                                'Master key concepts through structured lessons and practical coding exercises.'}
                        </p>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 p-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{lessonCount} Lessons</Badge>
                            <Badge variant="outline">{problemCount} Problems</Badge>
                        </div>

                        <LessonList lessonCount={lessonCount} />

                        <div className="rounded-xl border border-border bg-surface/60 p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Completion</span>
                                <span className="text-sm font-bold text-gray-700">{progressPercent}%</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-surface-elevated">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-primary-cyan via-primary-blue to-primary-violet"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                                />
                            </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-gray-700">
                                    {teacherInitial}
                                </span>
                                <div className="text-xs font-semibold text-muted">
                                    <div className="mb-0.5 flex items-center gap-1">
                                        <UserRound size={13} />
                                        <span>Instructor</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">{course.teacher?.name || 'Teacher'}</p>
                                </div>
                            </div>
                            <div className="inline-flex items-center gap-1 text-sm font-semibold text-primary-cyan transition-transform dur-normal group-hover:translate-x-1">
                                <span>Open</span>
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export default CourseCard;
