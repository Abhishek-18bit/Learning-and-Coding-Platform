import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ClipboardCheck, Clock, Loader2, Radar, Trophy } from 'lucide-react';
import { quizService } from '../services/quiz.service';
import { dashboardService } from '../services/dashboard.service';
import { fadeIn, staggerContainer } from '../animations/variants';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const QuizListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: quizzes, isLoading, isError } = useQuery({
        queryKey: ['quizzes', 'available', user?.id, user?.role],
        enabled: Boolean(user),
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
        retry: false,
    });

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="typ-muted font-medium">Loading available quizzes...</p>
            </div>
        );
    }

    const totalQuizzes = quizzes?.length || 0;
    const totalMarks = (quizzes || []).reduce((sum, quiz) => sum + (quiz.totalMarks || 0), 0);

    return (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="mission-page">
            <motion.section variants={fadeIn} className="mission-shell p-6 lg:p-7">
                <div className="mission-shell-content flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <span className="mission-kicker">
                            <span className="mission-kicker-dot" />
                            Assessment Hub
                        </span>
                        <h1 className="mission-title mt-3">Available Quizzes</h1>
                        <p className="mission-subtitle">
                            Test your knowledge, track speed and accuracy, and measure real learning progress.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mission-chip">
                            <Radar size={13} />
                            {totalQuizzes} quizzes live
                        </span>
                        <span className="mission-chip">
                            <Trophy size={13} />
                            {totalMarks} total marks
                        </span>
                    </div>
                </div>
            </motion.section>

            {isError ? (
                <motion.div variants={fadeIn}>
                    <Card variant="layered" className="border border-error/35 bg-error/15 p-4 text-center text-error">
                        Error connecting to server. Please try again.
                    </Card>
                </motion.div>
            ) : null}

            <motion.section variants={staggerContainer} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {quizzes?.map((quiz) => {
                    const isExpired = Boolean(quiz.deadline && new Date(quiz.deadline).getTime() <= Date.now());
                    return (
                    <motion.div key={quiz.id} variants={fadeIn} whileHover={{ y: -4 }}>
                        <Card variant="layered" hoverLift className="h-full flex flex-col space-y-4">
                            <div className="flex items-start justify-between gap-2">
                                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-blue/15 text-primary-cyan">
                                    <ClipboardCheck size={24} />
                                </span>
                                <Badge variant={isExpired ? 'error' : 'success'}>{isExpired ? 'Closed' : 'Active'}</Badge>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{quiz.title}</h3>
                                <p className="text-xs text-muted mt-1">{(quiz as any).courseTitle}</p>
                            </div>

                            <div className="space-y-2 text-sm text-muted">
                                <div className="inline-flex items-center gap-2">
                                    <Clock size={14} />
                                    <span>{quiz.timeLimit} mins</span>
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <Trophy size={14} />
                                    <span>{quiz.totalMarks} marks</span>
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <Clock size={14} />
                                    <span>{quiz.deadline ? `Due ${new Date(quiz.deadline).toLocaleDateString()}` : 'No deadline'}</span>
                                </div>
                            </div>

                            <Button
                                variant="secondary"
                                fullWidth
                                className="mt-auto"
                                disabled={isExpired && user?.role === 'STUDENT'}
                                onClick={() => navigate(`/app/quiz/${quiz.id}`)}
                            >
                                {isExpired && user?.role === 'STUDENT' ? 'Deadline Passed' : 'Start Assessment'}
                                <ArrowRight size={15} />
                            </Button>
                        </Card>
                    </motion.div>
                    );
                })}

                {(!quizzes || quizzes.length === 0) ? (
                    <motion.div variants={fadeIn} className="col-span-full">
                        <Card variant="layered" className="p-14 text-center space-y-4">
                            <BookOpen size={54} className="mx-auto text-muted" />
                            <h3 className="typ-h3 !text-2xl mb-0">No Quizzes Found</h3>
                            <p className="typ-muted max-w-md mx-auto">
                                {user?.role === 'STUDENT'
                                    ? 'No quizzes found for your enrolled courses yet.'
                                    : 'No quizzes found for your courses yet.'}
                            </p>
                            <div className="flex justify-center">
                                <Button variant="primary" onClick={() => navigate('/app/courses')}>
                                    Browse Courses
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ) : null}
            </motion.section>
        </motion.div>
    );
};

export default QuizListPage;
