import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CourseMaterials from '../components/CourseMaterials';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, PlayCircle, Lock, Loader2, CheckCircle2, BookOpen, Plus, ClipboardCheck, ArrowRight, Clock, Trophy } from 'lucide-react';
import { courseService } from '../services/course.service';
import { quizService } from '../services/quiz.service';
import { problemService } from '../services/problem.service';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboard.service';

const CourseDetailPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
    const isStudent = user?.role === 'STUDENT';
    const [enrollmentMessage, setEnrollmentMessage] = useState('');
    const [enrollmentError, setEnrollmentError] = useState('');

    const { data: course, isLoading, isError } = useQuery({
        queryKey: ['course', courseId],
        queryFn: () => courseService.getById(courseId!),
        enabled: !!courseId,
    });

    const { data: courseQuizzes, isLoading: quizzesLoading } = useQuery({
        queryKey: ['quizzes', courseId],
        queryFn: () => quizService.getByCourse(courseId!),
        enabled: !!courseId,
    });
    const { data: allProblems, isLoading: problemsLoading } = useQuery({
        queryKey: ['problems', 'all', 'course-detail', courseId],
        queryFn: () => problemService.getAll(),
        enabled: !!courseId,
    });

    const { data: studentDashboard } = useQuery({
        queryKey: ['student-dashboard', 'course-enrollment', user?.id],
        queryFn: () => dashboardService.getStudentData(),
        enabled: Boolean(user?.id && isStudent),
    });

    const { data: enrolledStudents, isLoading: studentsLoading } = useQuery({
        queryKey: ['course-students', courseId],
        queryFn: () => courseService.getEnrolledStudents(courseId!),
        enabled: Boolean(courseId && isTeacher),
    });

    const enrollMutation = useMutation({
        mutationFn: () => courseService.enroll(courseId!),
        onSuccess: () => {
            setEnrollmentError('');
            setEnrollmentMessage('You are now enrolled in this course.');
            queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['student-dashboard', 'course-enrollment', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to enroll. Please try again.';
            setEnrollmentMessage('');
            setEnrollmentError(message);
        },
    });

    const unenrollMutation = useMutation({
        mutationFn: () => courseService.unenroll(courseId!),
        onSuccess: () => {
            setEnrollmentError('');
            setEnrollmentMessage('You have been unenrolled from this course.');
            queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['student-dashboard', 'course-enrollment', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to unenroll. Please try again.';
            setEnrollmentMessage('');
            setEnrollmentError(message);
        },
    });

    const isEnrolled = Boolean(
        isStudent && courseId && studentDashboard?.enrolledCourses?.some((course) => course.id === courseId)
    );
    const isEnrollmentPending = enrollMutation.isPending || unenrollMutation.isPending;
    const activeStudentsCount = enrolledStudents?.length || 0;
    const courseProblemCount = (allProblems || []).filter((problem) => problem.lesson?.courseId === courseId).length;

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-secondary font-medium">Preparing curriculum...</p>
            </div>
        );
    }

    if (isError || !course) {
        return (
            <div className="card-premium p-20 text-center space-y-4 max-w-2xl mx-auto mt-10">
                <BookOpen size={64} className="mx-auto text-accent-red/20 mb-4" />
                <h2 className="text-2xl font-bold font-headlines">Course not found</h2>
                <p className="text-secondary">The course you're looking for doesn't exist or you don't have access to it.</p>
                <button onClick={() => navigate('/app/courses')} className="btn-gradient px-8">Back to Catalog</button>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-gray-900 min-h-[400px] flex items-center p-12 text-white">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
                <div className="relative z-10 max-w-3xl space-y-6">
                    <button
                        onClick={() => navigate('/app/courses')}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4 group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold uppercase tracking-widest text-[10px]">Back to catalog</span>
                    </button>
                    <h1 className="text-5xl font-extrabold font-headlines leading-tight">{course.title}</h1>
                    <p className="text-xl text-white/70 leading-relaxed font-medium">{course.description}</p>

                    <div className="flex items-center gap-8 pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                                {course.teacher?.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-[10px] text-white/50 uppercase font-bold tracking-tighter">Instructor</p>
                                <p className="font-bold">{course.teacher?.name}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/50 uppercase font-bold tracking-tighter">Level</p>
                            <p className="font-bold">Beginner to Advanced</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left: Curriculum */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold font-headlines tracking-tight">Curriculum</h2>
                        <div className="flex items-center gap-3">
                            {isTeacher && (
                                <>
                                    <button
                                        onClick={() => navigate(`/app/course/${courseId}/lesson/create`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold uppercase transition-all hover:bg-primary/20"
                                    >
                                        <Plus size={14} />
                                        Add Lesson
                                    </button>
                                    <button
                                        onClick={() => navigate(`/app/course/${courseId}/problem/create`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold uppercase transition-all hover:bg-gray-200"
                                    >
                                        <ClipboardCheck size={14} />
                                        Add Problem
                                    </button>
                                </>
                            )}
                            <span className="text-secondary font-bold text-sm bg-gray-100 px-4 py-1.5 rounded-full">
                                {course.lessons.length} Lessons
                            </span>
                            <span className="text-accent-blue font-bold text-sm bg-accent-blue/10 px-4 py-1.5 rounded-full">
                                {problemsLoading ? '...' : courseProblemCount} Problems
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {course.lessons.map((lesson: any, idx: number) => (
                            <div
                                key={lesson.id}
                                onClick={() => navigate(`/app/lesson/${lesson.id}`)}
                                className="card-premium group hover:border-primary/20 cursor-pointer flex items-center justify-between transition-all"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary/40 group-hover:bg-primary/10 group-hover:text-primary transition-all font-headlines font-bold text-lg">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors text-lg">{lesson.title}</h4>
                                        <p className="text-xs text-secondary mt-1 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            15 mins approx.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="p-2 text-gray-300 group-hover:text-primary transition-colors">
                                        <PlayCircle size={28} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {course.lessons.length === 0 && (
                            <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] space-y-4">
                                <BookOpen size={48} className="mx-auto text-gray-100" />
                                <p className="text-secondary font-medium italic">No lessons published yet.</p>
                                {isTeacher && (
                                    <button
                                        onClick={() => navigate(`/app/course/${courseId}/lesson/create`)}
                                        className="btn-gradient inline-flex"
                                    >
                                        Create First Lesson
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-gray-100 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-bold font-headlines tracking-tight">Course Quizzes</h2>
                            <span className="text-secondary font-bold text-sm bg-gray-100 px-4 py-1.5 rounded-full">
                                {courseQuizzes?.length || 0} Quizzes
                            </span>
                        </div>

                        {quizzesLoading ? (
                            <div className="card-premium p-8 text-center">
                                <Loader2 className="animate-spin text-primary mx-auto mb-3" />
                                <p className="text-secondary text-sm">Loading quizzes...</p>
                            </div>
                        ) : courseQuizzes && courseQuizzes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {courseQuizzes.map((quiz) => (
                                    <div key={quiz.id} className="card-premium group hover:border-primary/20 transition-all flex flex-col">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <ClipboardCheck size={22} />
                                            </div>
                                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                Available
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">{quiz.title}</h3>
                                        <div className="mt-4 flex items-center gap-4 text-xs text-secondary font-medium">
                                            <span className="inline-flex items-center gap-1"><Clock size={13} /> {quiz.timeLimit} mins</span>
                                            <span className="inline-flex items-center gap-1"><Trophy size={13} /> {quiz.totalMarks} marks</span>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/app/quiz/${quiz.id}`)}
                                            className="mt-6 w-full py-3 bg-gray-50 group-hover:bg-primary group-hover:text-white rounded-xl font-bold text-gray-900 transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            Start Quiz
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card-premium p-8 text-center text-secondary">
                                <p className="font-medium">No quizzes published for this course yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Sidebar Stats */}
                <div className="space-y-8">
                    <CourseMaterials courseId={courseId!} isTeacher={isTeacher} />
                    <div className="card-premium bg-primary text-white space-y-6 !border-none shadow-medium">
                        <h3 className="text-xl font-bold font-headlines tracking-wide">Course Engagement</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/60">
                                <span>Curriculum Progress</span>
                                <span>0%</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white w-0 rounded-full"></div>
                            </div>
                        </div>
                        <div className="space-y-3 pt-4">
                            {isStudent ? (
                                <>
                                    {isEnrolled ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (course.lessons.length > 0) {
                                                        navigate(`/app/lesson/${course.lessons[0].id}`);
                                                    }
                                                }}
                                                disabled={course.lessons.length === 0}
                                                className="w-full py-4 bg-white text-primary font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Continue Path
                                            </button>
                                            <button
                                                onClick={() => unenrollMutation.mutate()}
                                                disabled={isEnrollmentPending}
                                                className="w-full py-3 bg-primary-dark/30 text-white font-bold rounded-2xl border border-white/10 hover:bg-primary-dark/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {unenrollMutation.isPending ? 'Unenrolling...' : 'Unenroll'}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => enrollMutation.mutate()}
                                            disabled={isEnrollmentPending}
                                            className="w-full py-4 bg-white text-primary font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {enrollMutation.isPending ? 'Enrolling...' : 'Enroll in Course'}
                                        </button>
                                    )}
                                    {enrollmentMessage && (
                                        <p className="notification-slide-in text-xs font-semibold text-emerald-200">{enrollmentMessage}</p>
                                    )}
                                    {enrollmentError && (
                                        <p className="notification-slide-in text-xs font-semibold text-red-200">{enrollmentError}</p>
                                    )}
                                </>
                            ) : (
                                <button className="w-full py-4 bg-white text-primary font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                                    Continue Path
                                </button>
                            )}
                            {isTeacher && (
                                <button
                                    onClick={() => navigate(`/app/course/${courseId}/quiz/create`)}
                                    className="w-full py-4 bg-primary-dark/30 text-white font-bold rounded-2xl border border-white/10 hover:bg-primary-dark/50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Lock size={16} />
                                    Launch Assessment
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="card-premium space-y-6">
                        <h3 className="text-xl font-bold font-headlines">Course Insights</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Active Students', value: isTeacher ? String(activeStudentsCount) : '1.2k+', icon: <Users size={18} /> },
                                { label: 'Community Rating', value: '4.8/5', icon: <CheckCircle2 size={18} /> },
                                { label: 'Total Content', value: '14 Hours', icon: <Loader2 size={18} /> }
                            ].map((item, id) => (
                                <div key={id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div className="flex items-center gap-3 text-secondary">
                                        {item.icon}
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isTeacher && (
                        <div className="card-premium space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold font-headlines">Enrolled Students</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold uppercase tracking-widest text-secondary">
                                        {activeStudentsCount} Total
                                    </span>
                                    <button
                                        onClick={() => navigate(`/app/course/${courseId}/students`)}
                                        className="text-[11px] font-bold uppercase tracking-widest text-primary hover:underline"
                                    >
                                        View All
                                    </button>
                                </div>
                            </div>
                            {studentsLoading ? (
                                <div className="py-6 text-center text-secondary text-sm">
                                    Loading students...
                                </div>
                            ) : !enrolledStudents || enrolledStudents.length === 0 ? (
                                <div className="py-6 text-center text-secondary text-sm">
                                    No students enrolled yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {enrolledStudents.slice(0, 8).map((student) => (
                                        <div key={student.id} className="rounded-2xl border border-gray-100 p-3">
                                            <p className="font-semibold text-gray-900">{student.name}</p>
                                            <p className="text-xs text-secondary">{student.email}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-secondary">
                                                <span>Enrolled: {new Date(student.enrolledAt).toLocaleDateString()}</span>
                                                <span>Attempts: {student.quizAttempts}</span>
                                                <span>Avg Score: {student.averageScore}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Simple Users icon placeholder
const Users = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export default CourseDetailPage;
