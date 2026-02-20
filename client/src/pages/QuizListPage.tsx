import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Clock, Trophy, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { quizService } from '../services/quiz.service';
import { dashboardService } from '../services/dashboard.service';
import { fadeIn, staggerContainer } from '../animations/variants';
import { useAuth } from '../contexts/AuthContext';

const QuizListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: quizzes, isLoading, isError } = useQuery({
        queryKey: ['quizzes', 'available', user?.id, user?.role],
        enabled: !!user,
        queryFn: async () => {
            if (!user) return [];

            let courseIds: string[] = [];
            let courseTitleById = new Map<string, string>();

            if (user.role === 'STUDENT') {
                const studentDashboard = await dashboardService.getStudentData();
                const studentCourses = studentDashboard.enrolledCourses?.length
                    ? studentDashboard.enrolledCourses
                    : studentDashboard.continueLearning;

                courseIds = studentCourses.map((course) => course.id);
                courseTitleById = new Map(studentCourses.map((course) => [course.id, course.title]));
            } else {
                const teacherDashboard = await dashboardService.getTeacherData();
                courseIds = teacherDashboard.courses.map((course) => course.id);
                courseTitleById = new Map(teacherDashboard.courses.map((course) => [course.id, course.title]));
            }

            const uniqueCourseIds = Array.from(new Set(courseIds));
            if (uniqueCourseIds.length === 0) return [];

            const quizzesByCourse = await Promise.all(
                uniqueCourseIds.map(async (courseId) => {
                    try {
                        return await quizService.getByCourse(courseId);
                    } catch {
                        return [];
                    }
                })
            );

            return quizzesByCourse
                .flat()
                .map((quiz) => ({
                    ...quiz,
                    courseTitle: courseTitleById.get(quiz.courseId) || 'Course',
                }))
                .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
        },
        retry: false
    });

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-secondary font-medium">Loading available quizzes...</p>
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
            <motion.div variants={fadeIn}>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Available Quizzes</h1>
                <p className="text-secondary mt-1">Test your knowledge and earn marks to measure your progress.</p>
            </motion.div>

            <motion.div
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                {quizzes?.map((quiz) => (
                    <motion.div
                        key={quiz.id}
                        variants={fadeIn}
                        whileHover={{ y: -5 }}
                        className="card-premium group hover:border-primary/20 transition-all flex flex-col h-full"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <ClipboardCheck size={28} />
                            </div>
                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                Active
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight mb-2">
                            {quiz.title}
                        </h3>
                        <p className="text-xs text-secondary font-semibold">{(quiz as any).courseTitle}</p>

                        <div className="flex-grow space-y-4 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-secondary">
                                    <Clock size={16} />
                                    <span className="text-sm font-medium">{quiz.timeLimit} Mins</span>
                                </div>
                                <div className="flex items-center gap-2 text-secondary">
                                    <Trophy size={16} />
                                    <span className="text-sm font-medium">{quiz.totalMarks} Marks</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(`/app/quiz/${quiz.id}`)}
                            className="mt-8 w-full py-4 bg-gray-50 group-hover:bg-primary group-hover:text-white rounded-xl font-bold text-gray-900 transition-all flex items-center justify-center gap-2"
                        >
                            Start Assessment
                            <ArrowRight size={18} />
                        </button>
                    </motion.div>
                ))}

                {(!quizzes || quizzes.length === 0) && (
                    <motion.div variants={fadeIn} className="col-span-full card-premium p-20 text-center space-y-6">
                        <BookOpen size={64} className="mx-auto text-gray-200" />
                        <h3 className="text-2xl font-bold">No Quizzes Found</h3>
                        <p className="text-secondary max-w-sm mx-auto">
                            {user?.role === 'STUDENT'
                                ? 'No quizzes found for your enrolled courses yet.'
                                : 'No quizzes found for your courses yet.'}
                        </p>
                        <button
                            onClick={() => navigate('/app/courses')}
                            className="btn-gradient inline-flex px-8"
                        >
                            Browse Courses
                        </button>
                    </motion.div>
                )}
            </motion.div>

            {isError && (
                <motion.div variants={fadeIn} className="card-premium p-10 text-center bg-red-50 border-red-100">
                    <p className="text-accent-red font-bold">Error connecting to server. Please try again.</p>
                </motion.div>
            )}
        </motion.div>
    );
};

export default QuizListPage;
