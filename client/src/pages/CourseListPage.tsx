import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { courseService } from '../services/course.service';
import { problemService } from '../services/problem.service';
import { fadeIn, staggerContainer } from '../animations/variants';
import CourseCard from '../components/course/CourseCard';
import Card from '../components/ui/Card';

const CourseListPage = () => {
    const navigate = useNavigate();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['courses'],
        queryFn: () => courseService.getAll(),
    });
    const { data: problems } = useQuery({
        queryKey: ['problems', 'all', 'course-counts'],
        queryFn: () => problemService.getAll(),
    });

    const problemCountByCourseId = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const problem of problems || []) {
            const courseId = problem.lesson?.courseId;
            if (!courseId) continue;
            counts[courseId] = (counts[courseId] || 0) + 1;
        }
        return counts;
    }, [problems]);
    const maxLessonCount = useMemo(
        () => Math.max(1, ...(data?.courses?.map((course) => course._count?.lessons || 0) || [1])),
        [data?.courses]
    );

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="typ-muted font-medium">Fetching catalog...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-10"
        >
            {/* Header */}
            <motion.div
                variants={fadeIn}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div>
                    <h1 className="typ-h1 mb-1">Explore Courses</h1>
                    <p className="typ-muted">Discover structured learning paths to master your craft.</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search for subjects, skills, or teachers..."
                        className="input-base pl-12 pr-4 py-3 font-medium"
                    />
                </div>
            </motion.div>

            {/* Course Grid */}
            <motion.div
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                {data?.courses?.map((course) => (
                    <motion.article
                        key={course.id}
                        variants={fadeIn}
                        className="h-full"
                    >
                        <CourseCard
                            course={course}
                            problemCount={problemCountByCourseId[course.id] || 0}
                            progressPercent={Math.min(
                                100,
                                Math.round(
                                    ((course._count?.lessons || 0) / maxLessonCount) * 70 +
                                        Math.min((problemCountByCourseId[course.id] || 0) * 6, 30)
                                )
                            )}
                            onOpen={() => navigate(`/app/course/${course.id}`)}
                        />
                    </motion.article>
                ))}
            </motion.div>

            {isError && (
                <motion.div variants={fadeIn}>
                    <Card variant="layered" className="p-10 text-center">
                        <p className="text-error font-bold">Failed to load courses. Please try again later.</p>
                    </Card>
                </motion.div>
            )}

            {/* Empty State */}
            {data?.courses?.length === 0 && (
                <motion.div variants={fadeIn}>
                    <Card variant="layered" className="p-20 text-center">
                        <BookOpen size={64} className="mx-auto text-muted mb-6" />
                        <h3 className="typ-h3">No courses available yet</h3>
                        <p className="typ-muted mt-2 max-w-sm mx-auto">
                            Check back soon for new content or contact your administrator.
                        </p>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
};

export default CourseListPage;
