import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Compass,
    Clock,
    Loader2,
    Lock,
    PlayCircle,
    Plus,
    Radar,
    Trash2,
    Trophy,
    Users,
} from 'lucide-react';
import CourseMaterials from '../components/CourseMaterials';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import { courseService } from '../services/course.service';
import { quizService } from '../services/quiz.service';
import { problemService } from '../services/problem.service';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboard.service';
import { renderContentHtml } from '../utils/contentRenderer';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => UUID_PATTERN.test(value);

const getTopicTimestamp = (topic: { createdAt?: string; updatedAt?: string }) => {
    const source = topic.createdAt || topic.updatedAt;
    if (!source) return 0;
    const parsed = Date.parse(source);
    return Number.isNaN(parsed) ? 0 : parsed;
};

const getOrderedTopics = <T extends { sortOrder: number; title: string; createdAt?: string; updatedAt?: string }>(topics: T[]) => {
    return [...topics].sort((left, right) => {
        const bySortOrder = (left.sortOrder || 0) - (right.sortOrder || 0);
        if (bySortOrder !== 0) return bySortOrder;

        const byCreatedAt = getTopicTimestamp(left) - getTopicTimestamp(right);
        if (byCreatedAt !== 0) return byCreatedAt;

        return left.title.localeCompare(right.title);
    });
};

const CourseDetailPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
    const isStudent = user?.role === 'STUDENT';
    const [enrollmentMessage, setEnrollmentMessage] = useState('');
    const [enrollmentError, setEnrollmentError] = useState('');
    const [deleteQuizTarget, setDeleteQuizTarget] = useState<{ id: string; title: string } | null>(null);
    const [isDeleteCourseOpen, setIsDeleteCourseOpen] = useState(false);
    const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
    const [showStructureManager, setShowStructureManager] = useState(false);
    const [newUnitTitle, setNewUnitTitle] = useState('');
    const [newUnitHours, setNewUnitHours] = useState('8');
    const [newTopicUnitId, setNewTopicUnitId] = useState('');
    const [newTopicTitle, setNewTopicTitle] = useState('');
    const [newTopicMinutes, setNewTopicMinutes] = useState('30');
    const [newTopicLessonId, setNewTopicLessonId] = useState('');
    const [expandedTopicKey, setExpandedTopicKey] = useState<string | null>(null);

    const { data: course, isLoading, isError } = useQuery({
        queryKey: ['course', courseId],
        queryFn: () => courseService.getById(courseId!),
        enabled: Boolean(courseId),
    });

    const { data: courseQuizzes, isLoading: quizzesLoading } = useQuery({
        queryKey: ['quizzes', courseId],
        queryFn: () => quizService.getByCourse(courseId!),
        enabled: Boolean(courseId),
    });

    const { data: allProblems, isLoading: problemsLoading } = useQuery({
        queryKey: ['problems', 'all', 'course-detail', courseId],
        queryFn: () => problemService.getAll(),
        enabled: Boolean(courseId),
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

    const deleteQuizMutation = useMutation({
        mutationFn: (quizId: string) => quizService.remove(quizId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            queryClient.invalidateQueries({ queryKey: ['teacher-quiz-library'] });
            setDeleteQuizTarget(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to delete quiz.';
            window.alert(message);
        },
    });

    const deleteCourseMutation = useMutation({
        mutationFn: () => courseService.remove(courseId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
            setIsDeleteCourseOpen(false);
            navigate('/app/courses');
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to delete course.';
            window.alert(message);
        },
    });

    const createUnitMutation = useMutation({
        mutationFn: (payload: { title: string; estimatedHours?: number }) => courseService.createUnit(courseId!, payload),
        onSuccess: () => {
            setNewUnitTitle('');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to create unit.';
            window.alert(message);
        },
    });

    const createTopicMutation = useMutation({
        mutationFn: (payload: { unitId: string; title: string; estimatedMinutes?: number; lessonId?: string }) =>
            courseService.createTopic(courseId!, payload.unitId, {
                title: payload.title,
                estimatedMinutes: payload.estimatedMinutes,
                lessonId: payload.lessonId,
            }),
        onSuccess: () => {
            setNewTopicTitle('');
            setNewTopicLessonId('');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to create topic.';
            window.alert(message);
        },
    });

    const reorderUnitsMutation = useMutation({
        mutationFn: (unitIds: string[]) => courseService.reorderUnits(courseId!, unitIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to reorder units.';
            window.alert(message);
        },
    });

    const reorderTopicsMutation = useMutation({
        mutationFn: (payload: { unitId: string; topicIds: string[] }) =>
            courseService.reorderTopics(courseId!, payload.unitId, payload.topicIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to reorder topics.';
            window.alert(message);
        },
    });

    const isEnrolled = Boolean(
        isStudent && courseId && studentDashboard?.enrolledCourses?.some((item) => item.id === courseId)
    );
    const isEnrollmentPending = enrollMutation.isPending || unenrollMutation.isPending;
    const activeStudentsCount = enrolledStudents?.length || 0;
    const courseProblemCount = (allProblems || []).filter((problem) => problem.lesson?.courseId === courseId).length;
    const totalQuizMarks = (courseQuizzes || []).reduce((sum, quiz) => sum + (quiz.totalMarks || 0), 0);
    const lessonUnits = useMemo(() => {
        if (course?.units && course.units.length > 0) {
            return course.units;
        }

        if (course?.lessons && course.lessons.length > 0) {
            return [
                {
                    id: 'fallback-unit-1',
                    title: 'Unit 1',
                    sortOrder: 1,
                    estimatedHours: Math.max(4, course.lessons.length * 2),
                    topics: course.lessons.map((lesson, index) => ({
                        id: `fallback-topic-${lesson.id}`,
                        title: lesson.title,
                        sortOrder: index + 1,
                        estimatedMinutes: 30,
                        lessonId: lesson.id,
                        lesson: {
                            id: lesson.id,
                            title: lesson.title,
                            content: lesson.content || null,
                            createdAt: lesson.createdAt,
                        },
                    })),
                },
            ];
        }

        return [];
    }, [course?.lessons, course?.units]);
    const persistedUnits = useMemo(() => lessonUnits.filter((unit) => isUuid(unit.id)), [lessonUnits]);

    useEffect(() => {
        if (!expandedUnitId && lessonUnits.length > 0) {
            setExpandedUnitId(lessonUnits[0].id);
        }
    }, [lessonUnits, expandedUnitId]);

    useEffect(() => {
        if (!newTopicUnitId && persistedUnits.length > 0) {
            setNewTopicUnitId(persistedUnits[0].id);
        }
    }, [persistedUnits, newTopicUnitId]);

    const totalEstimatedHours = lessonUnits.reduce((sum, unit) => sum + (unit.estimatedHours || 0), 0);

    const handleCreateUnit = () => {
        const title = newUnitTitle.trim();
        const hours = Number(newUnitHours);
        if (!title) {
            window.alert('Unit title is required.');
            return;
        }

        createUnitMutation.mutate({
            title,
            estimatedHours: Number.isFinite(hours) && hours > 0 ? hours : undefined,
        });
    };

    const handleCreateTopic = () => {
        const title = newTopicTitle.trim();
        const minutes = Number(newTopicMinutes);
        if (!newTopicUnitId) {
            window.alert('Select a unit.');
            return;
        }
        if (!isUuid(newTopicUnitId)) {
            window.alert('Please select a real unit before adding a topic.');
            return;
        }
        if (!title) {
            window.alert('Topic title is required.');
            return;
        }

        createTopicMutation.mutate({
            unitId: newTopicUnitId,
            title,
            estimatedMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : undefined,
            lessonId: newTopicLessonId || undefined,
        });
    };

    const handleMoveUnit = (unitId: string, direction: 'up' | 'down') => {
        if (reorderUnitsMutation.isPending) {
            return;
        }
        if (!isUuid(unitId) || !lessonUnits.every((unit) => isUuid(unit.id))) {
            window.alert('Unit reordering is unavailable until course structure is fully synced.');
            return;
        }

        const index = lessonUnits.findIndex((unit) => unit.id === unitId);
        if (index < 0) {
            return;
        }
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= lessonUnits.length) {
            return;
        }

        const reordered = [...lessonUnits];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
        reorderUnitsMutation.mutate(reordered.map((unit) => unit.id));
    };

    const handleMoveTopic = (unitId: string, topicId: string, direction: 'up' | 'down') => {
        if (reorderTopicsMutation.isPending) {
            return;
        }
        if (!isUuid(unitId)) {
            window.alert('Topic reordering is unavailable for fallback units.');
            return;
        }

        const unit = lessonUnits.find((item) => item.id === unitId);
        if (!unit) {
            return;
        }
        const orderedTopics = getOrderedTopics(unit.topics);
        if (!isUuid(topicId) || !orderedTopics.every((topic) => isUuid(topic.id))) {
            window.alert('Topic reordering is unavailable until course structure is fully synced.');
            return;
        }

        const index = orderedTopics.findIndex((topic) => topic.id === topicId);
        if (index < 0) {
            return;
        }
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= orderedTopics.length) {
            return;
        }

        const reordered = [...orderedTopics];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
        reorderTopicsMutation.mutate({
            unitId,
            topicIds: reordered.map((topic) => topic.id),
        });
    };

    const handleOpenTopic = (unitId: string, topic: {
        id: string;
        title: string;
        estimatedMinutes?: number | null;
        lesson?: { id: string } | null;
    }) => {
        if (topic.lesson?.id) {
            navigate(`/app/lesson/${topic.lesson.id}`);
            return;
        }

        if (!isTeacher) {
            return;
        }

        const params = new URLSearchParams({
            unitId,
            topicId: topic.id,
            topicTitle: topic.title,
            estimatedMinutes: String(topic.estimatedMinutes || 30),
        });
        navigate(`/app/course/${courseId}/lesson/create?${params.toString()}`);
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="typ-muted font-medium">Preparing curriculum...</p>
            </div>
        );
    }

    if (isError || !course) {
        return (
            <Card variant="layered" className="mx-auto mt-8 max-w-2xl p-12 text-center space-y-4">
                <BookOpen size={56} className="mx-auto text-error/40" />
                <h2 className="typ-h2 !text-2xl mb-0">Course not found</h2>
                <p className="typ-muted">The course is unavailable or you do not have access.</p>
                <div className="flex justify-center">
                    <Button variant="primary" onClick={() => navigate('/app/courses')}>
                        Back to Catalog
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="mission-page">
            <section className="mission-shell p-6 lg:p-7">
                <div className="mission-shell-content space-y-5">
                    <button
                        onClick={() => navigate('/app/courses')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-gray-700"
                    >
                        <ChevronLeft size={16} />
                        Back to catalog
                    </button>

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <span className="mission-kicker">
                                <span className="mission-kicker-dot" />
                                Course Mission Brief
                            </span>
                            <h1 className="mission-title mt-3">{course.title}</h1>
                            <p className="mission-subtitle">{course.description || 'Structured lessons, coding problems, and quizzes.'}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="mission-chip">
                                <BookOpen size={13} />
                                {course.lessons.length} lessons
                            </span>
                            <span className="mission-chip">
                                <ClipboardCheck size={13} />
                                {courseQuizzes?.length || 0} quizzes
                            </span>
                            <span className="mission-chip">
                                <Radar size={13} />
                                {problemsLoading ? '...' : courseProblemCount} problems
                            </span>
                        </div>
                    </div>

                    <hr className="mission-divider" />

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="mission-metric">
                            <span className="mission-metric-label">Instructor</span>
                            <span className="mission-metric-value">{course.teacher?.name || 'Unknown'}</span>
                        </div>
                        <div className="mission-metric">
                            <span className="mission-metric-label">Curriculum</span>
                            <span className="mission-metric-value">{course.lessons.length} modules</span>
                        </div>
                        <div className="mission-metric">
                            <span className="mission-metric-label">Assessments</span>
                            <span className="mission-metric-value">{courseQuizzes?.length || 0} quizzes</span>
                        </div>
                        <div className="mission-metric">
                            <span className="mission-metric-label">Total Marks</span>
                            <span className="mission-metric-value">{totalQuizMarks}</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.55fr]">
                <div className="space-y-6">
                    <Card variant="glass" className="overflow-hidden p-0">
                        <div className="border-b border-border/80 px-5 py-5 bg-[radial-gradient(120%_100%_at_8%_0%,rgba(168,85,247,0.07),rgba(168,85,247,0)_56%),linear-gradient(160deg,rgba(7,11,18,0.97),rgba(3,5,7,0.99))]">
                            <button
                                onClick={() => navigate('/app/courses')}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-gray-700 mb-4"
                            >
                                <ChevronLeft size={16} />
                                Back to courses
                            </button>

                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge variant="primary">CS-CORE</Badge>
                                <Badge variant="success">
                                    {lessonUnits.length} units · {totalEstimatedHours || Math.max(8, course.lessons.length * 2)} hours
                                </Badge>
                            </div>

                            <h2 className="typ-h2 !text-[2.15rem] !mb-2">{course.title}</h2>
                            <p className="typ-muted max-w-3xl">
                                {course.description || 'Complete this path with focused lessons, clear concepts, and practical checkpoints.'}
                            </p>

                            {isTeacher ? (
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => navigate(`/app/course/${courseId}/lesson/create`)}
                                    >
                                        <Plus size={14} />
                                        Add Lesson
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/app/course/${courseId}/problem/create`)}
                                        className="border border-border"
                                    >
                                        <ClipboardCheck size={14} />
                                        Add Problem
                                    </Button>
                                </div>
                            ) : null}
                        </div>

                        <div className="px-4 py-4 md:px-5 md:py-5">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-blue/15 border border-primary-blue/30 text-primary-cyan">
                                        <BookOpen size={18} />
                                    </span>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900">Units & Topics</p>
                                        <p className="text-xs text-muted">Structured lesson map</p>
                                    </div>
                                </div>
                                {isTeacher ? (
                                    <Button
                                        variant={showStructureManager ? 'ghost' : 'secondary'}
                                        size="sm"
                                        className="border border-border"
                                        onClick={() => setShowStructureManager((prev) => !prev)}
                                    >
                                        {showStructureManager ? 'Hide Manager' : 'Manage Structure'}
                                    </Button>
                                ) : null}
                            </div>

                            {isTeacher && showStructureManager ? (
                                <Card variant="glass" className="mb-4 space-y-3 p-4">
                                    <p className="text-sm font-semibold text-gray-900">Quick Structure Manager</p>

                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.2fr_120px_auto]">
                                        <input
                                            value={newUnitTitle}
                                            onChange={(event) => setNewUnitTitle(event.target.value)}
                                            placeholder="New unit title"
                                            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-gray-700"
                                        />
                                        <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            value={newUnitHours}
                                            onChange={(event) => setNewUnitHours(event.target.value)}
                                            placeholder="Hours"
                                            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-gray-700"
                                        />
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleCreateUnit}
                                            disabled={createUnitMutation.isPending}
                                        >
                                            {createUnitMutation.isPending ? 'Adding...' : 'Add Unit'}
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_120px_1fr_auto]">
                                        <select
                                            value={newTopicUnitId}
                                            onChange={(event) => setNewTopicUnitId(event.target.value)}
                                            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-gray-700"
                                        >
                                            <option value="">Select Unit</option>
                                            {persistedUnits.map((unit) => (
                                                <option key={unit.id} value={unit.id}>
                                                    {`Unit ${unit.sortOrder}: ${unit.title}`}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            value={newTopicTitle}
                                            onChange={(event) => setNewTopicTitle(event.target.value)}
                                            placeholder="New topic title"
                                            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-gray-700"
                                        />
                                        <input
                                            type="number"
                                            min={1}
                                            max={240}
                                            value={newTopicMinutes}
                                            onChange={(event) => setNewTopicMinutes(event.target.value)}
                                            placeholder="Minutes"
                                            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-gray-700"
                                        />
                                        <select
                                            value={newTopicLessonId}
                                            onChange={(event) => setNewTopicLessonId(event.target.value)}
                                            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-gray-700"
                                        >
                                            <option value="">No lesson link</option>
                                            {course.lessons.map((lesson) => (
                                                <option key={lesson.id} value={lesson.id}>
                                                    {lesson.title}
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleCreateTopic}
                                            disabled={createTopicMutation.isPending || persistedUnits.length === 0}
                                        >
                                            {createTopicMutation.isPending ? 'Adding...' : 'Add Topic'}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted">
                                        Use arrow controls on units/topics below to reorder.
                                    </p>
                                    {persistedUnits.length === 0 ? (
                                        <p className="text-xs font-semibold text-warning">
                                            Add at least one saved unit before creating topics.
                                        </p>
                                    ) : null}
                                </Card>
                            ) : null}

                            <div className="mb-0 flex items-center gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary-blue/35 bg-primary-blue/10 text-primary-blue">
                                    <BookOpen size={18} />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Curriculum Sections</p>
                                    <p className="text-xs text-muted">Expand a unit to view and open topics</p>
                                </div>
                            </div>

                            {lessonUnits.length > 0 ? (
                                <div className="space-y-4">
                                    {lessonUnits.map((unit) => {
                                        const isExpanded = expandedUnitId === unit.id;
                                        const orderedTopics = getOrderedTopics(unit.topics);
                                        const canReorderTopics = orderedTopics.every((item) => isUuid(item.id));

                                        return (
                                            <section
                                                key={unit.id}
                                                className="overflow-hidden rounded-2xl border border-border/80 bg-card/85 shadow-soft"
                                            >
                                                <div className="w-full px-5 py-4 text-left bg-[radial-gradient(120%_120%_at_6%_0%,rgba(34,211,238,0.08),rgba(34,211,238,0)_58%),linear-gradient(160deg,rgba(7,11,18,0.97),rgba(3,5,7,0.99))]">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedUnitId((prev) => (prev === unit.id ? null : unit.id))}
                                                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                                        >
                                                            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary-blue/35 bg-primary-blue/12 text-primary-blue">
                                                                <Compass size={17} />
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-blue">
                                                                    Unit {unit.sortOrder} - {unit.estimatedHours || Math.max(2, unit.topics.length * 2)} hrs
                                                                </p>
                                                                <p className="truncate text-[1.65rem] leading-tight font-semibold text-gray-900">
                                                                    {unit.title}
                                                                </p>
                                                            </div>
                                                        </button>
                                                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-muted shrink-0">
                                                            <span className="rounded-full border border-primary-blue/35 bg-primary-blue/10 px-3 py-1.5 text-primary-blue">
                                                                {unit.topics.length} topics
                                                            </span>
                                                            {isTeacher ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleMoveUnit(unit.id, 'up')}
                                                                        disabled={
                                                                            reorderUnitsMutation.isPending ||
                                                                            !isUuid(unit.id) ||
                                                                            !lessonUnits.every((item) => isUuid(item.id)) ||
                                                                            lessonUnits[0]?.id === unit.id
                                                                        }
                                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-muted hover:bg-surface-elevated hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-45"
                                                                        title="Move unit up"
                                                                    >
                                                                        <ArrowUp size={13} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleMoveUnit(unit.id, 'down')}
                                                                        disabled={
                                                                            reorderUnitsMutation.isPending ||
                                                                            !isUuid(unit.id) ||
                                                                            !lessonUnits.every((item) => isUuid(item.id)) ||
                                                                            lessonUnits[lessonUnits.length - 1]?.id === unit.id
                                                                        }
                                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-muted hover:bg-surface-elevated hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-45"
                                                                        title="Move unit down"
                                                                    >
                                                                        <ArrowDown size={13} />
                                                                    </button>
                                                                </span>
                                                            ) : null}
                                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        </div>
                                                    </div>
                                                </div>

                                                {isExpanded ? (
                                                    <div className="space-y-3 border-t border-border/70 bg-background/45 p-3">
                                                        {orderedTopics.map((topic) => {
                                                            const topicKey = `${unit.id}:${topic.id}`;
                                                            const isTopicExpanded = expandedTopicKey === topicKey;
                                                            const canOpenLesson = Boolean(topic.lesson?.id) || isTeacher;
                                                            return (
                                                                <div
                                                                    key={topic.id}
                                                                    className="overflow-hidden rounded-2xl border border-border/70 bg-surface/65"
                                                                >
                                                                    <div className="flex min-w-0 w-full items-center justify-between gap-3 px-4 py-3 transition dur-normal hover:bg-surface-elevated/60">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenTopic(unit.id, topic)}
                                                                            disabled={!canOpenLesson}
                                                                            className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-70"
                                                                        >
                                                                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary-blue/40 bg-primary-blue/10 text-primary-blue">
                                                                                <CheckCircle2 size={14} />
                                                                            </span>
                                                                            <div className="min-w-0">
                                                                                <p className="truncate text-[1.15rem] font-semibold text-gray-900">{topic.title}</p>
                                                                                <p className="mt-0.5 text-[11px] text-muted">
                                                                                    {topic.lesson?.id
                                                                                        ? `${topic.estimatedMinutes || 30} min`
                                                                                        : isTeacher
                                                                                            ? 'No content yet - click to add'
                                                                                            : `${topic.estimatedMinutes || 30} min`}
                                                                                </p>
                                                                            </div>
                                                                        </button>
                                                                        <div className="inline-flex items-center gap-1">
                                                                            {isTeacher ? (
                                                                                <>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleMoveTopic(unit.id, topic.id, 'up')}
                                                                                        disabled={
                                                                                            reorderTopicsMutation.isPending ||
                                                                                            !isUuid(unit.id) ||
                                                                                            !isUuid(topic.id) ||
                                                                                            !canReorderTopics ||
                                                                                            orderedTopics[0]?.id === topic.id
                                                                                        }
                                                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-muted hover:bg-surface-elevated hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-45"
                                                                                        title="Move topic up"
                                                                                    >
                                                                                        <ArrowUp size={13} />
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleMoveTopic(unit.id, topic.id, 'down')}
                                                                                        disabled={
                                                                                            reorderTopicsMutation.isPending ||
                                                                                            !isUuid(unit.id) ||
                                                                                            !isUuid(topic.id) ||
                                                                                            !canReorderTopics ||
                                                                                            orderedTopics[orderedTopics.length - 1]?.id === topic.id
                                                                                        }
                                                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-muted hover:bg-surface-elevated hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-45"
                                                                                        title="Move topic down"
                                                                                    >
                                                                                        <ArrowDown size={13} />
                                                                                    </button>
                                                                                </>
                                                                            ) : null}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setExpandedTopicKey((prev) => (prev === topicKey ? null : topicKey));
                                                                                }}
                                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-muted transition hover:bg-surface-elevated hover:text-gray-900"
                                                                                title={isTopicExpanded ? 'Hide preview' : 'Show preview'}
                                                                            >
                                                                                {isTopicExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {isTopicExpanded && topic.lesson?.content ? (
                                                                        <div className="border-t border-border/70 bg-background/70 px-5 py-4">
                                                                            <div className="rounded-xl border border-border/65 bg-card/70 px-4 py-3">
                                                                                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                                                                    Topic Preview
                                                                                </div>
                                                                                <div
                                                                                    className="max-h-72 overflow-y-auto pr-1"
                                                                                    dangerouslySetInnerHTML={{ __html: renderContentHtml(topic.lesson.content) }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : null}
                                            </section>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Card variant="layered" className="p-8 text-center">
                                    <p className="typ-muted">No lessons published yet.</p>
                                    {isTeacher ? (
                                        <div className="mt-4 flex justify-center">
                                            <Button variant="primary" onClick={() => navigate(`/app/course/${courseId}/lesson/create`)}>
                                                Create First Lesson
                                            </Button>
                                        </div>
                                    ) : null}
                                </Card>
                            )}
                        </div>
                    </Card>

                    <Card variant="layered" className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="mission-panel-title">
                                    <ClipboardCheck size={14} />
                                    Assessments
                                </p>
                                <h2 className="typ-h2 !text-2xl mt-2 mb-1">Course quizzes</h2>
                                <p className="typ-muted">Practice checkpoints linked to this course.</p>
                            </div>
                            <Badge variant="primary">{courseQuizzes?.length || 0} total</Badge>
                        </div>

                        {quizzesLoading ? (
                            <div className="h-24 flex items-center justify-center">
                                <Loader2 className="animate-spin text-primary" />
                            </div>
                        ) : courseQuizzes && courseQuizzes.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {courseQuizzes.map((quiz) => (
                                    <Card key={quiz.id} variant="glass" className="space-y-3 p-4" hoverLift>
                                        {(() => {
                                            const isExpired = Boolean(quiz.deadline && new Date(quiz.deadline).getTime() <= Date.now());
                                            return (
                                                <>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{quiz.title}</h3>
                                            <div className="flex items-center gap-2">
                                                {isTeacher ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteQuizTarget({ id: quiz.id, title: quiz.title })}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-error/35 bg-error/10 text-error transition-all hover:bg-error/20 hover:border-error/50"
                                                        title="Delete quiz"
                                                        aria-label={`Delete quiz ${quiz.title}`}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                ) : null}
                                                <Badge variant={isExpired ? 'error' : 'success'}>{isExpired ? 'Closed' : 'Available'}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                                            <span className="mission-chip !text-[11px] !px-2.5 !py-1">
                                                <Clock size={12} />
                                                {quiz.timeLimit} mins
                                            </span>
                                            <span className="mission-chip !text-[11px] !px-2.5 !py-1">
                                                <Trophy size={12} />
                                                {quiz.totalMarks} marks
                                            </span>
                                            <span className="mission-chip !text-[11px] !px-2.5 !py-1">
                                                {quiz.deadline ? `Due ${new Date(quiz.deadline).toLocaleDateString()}` : 'No deadline'}
                                            </span>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            fullWidth
                                            disabled={isStudent && isExpired}
                                            onClick={() => navigate(`/app/quiz/${quiz.id}`)}
                                        >
                                            {isStudent && isExpired ? 'Deadline Passed' : 'Start Quiz'}
                                            <ArrowRight size={14} />
                                        </Button>
                                                </>
                                            );
                                        })()}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card variant="glass" className="p-8 text-center">
                                <p className="typ-muted">No quizzes published for this course yet.</p>
                            </Card>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <CourseMaterials courseId={courseId!} isTeacher={isTeacher} />

                    <Card variant="glass" className="space-y-4">
                        <div>
                            <p className="mission-panel-title">
                                <Radar size={14} />
                                Course Engagement
                            </p>
                            <h3 className="typ-h3 !mb-1 !text-xl mt-2">Your track in this course</h3>
                            <p className="typ-muted">Enrollment controls and quick actions.</p>
                        </div>

                        <ProgressBar value={0} showLabel />

                        {isStudent ? (
                            <div className="space-y-2">
                                {isEnrolled ? (
                                    <>
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            onClick={() => {
                                                if (course.lessons.length > 0) {
                                                    navigate(`/app/lesson/${course.lessons[0].id}`);
                                                }
                                            }}
                                            disabled={course.lessons.length === 0}
                                        >
                                            <PlayCircle size={15} />
                                            Continue Path
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            fullWidth
                                            onClick={() => unenrollMutation.mutate()}
                                            disabled={isEnrollmentPending}
                                            className="border border-border"
                                        >
                                            {unenrollMutation.isPending ? 'Unenrolling...' : 'Unenroll'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        onClick={() => enrollMutation.mutate()}
                                        disabled={isEnrollmentPending}
                                    >
                                        {enrollMutation.isPending ? 'Enrolling...' : 'Enroll in Course'}
                                    </Button>
                                )}

                                {enrollmentMessage ? (
                                    <p className="notification-slide-in text-xs font-semibold text-success">{enrollmentMessage}</p>
                                ) : null}
                                {enrollmentError ? (
                                    <p className="notification-slide-in text-xs font-semibold text-error">{enrollmentError}</p>
                                ) : null}
                            </div>
                        ) : (
                            <Button variant="secondary" fullWidth>
                                <PlayCircle size={15} />
                                Continue Path
                            </Button>
                        )}

                        {isTeacher ? (
                            <div className="space-y-2">
                                <Button
                                    variant="danger"
                                    fullWidth
                                    onClick={() => navigate(`/app/course/${courseId}/quiz/create`)}
                                >
                                    <Lock size={15} />
                                    Launch Assessment
                                </Button>
                                <Button
                                    variant="danger"
                                    fullWidth
                                    onClick={() => setIsDeleteCourseOpen(true)}
                                    className="bg-gradient-to-r from-error/40 to-error/25 border-error/50 hover:from-error/50 hover:to-error/35"
                                >
                                    <Trash2 size={15} />
                                    Delete Course
                                </Button>
                            </div>
                        ) : null}
                    </Card>

                    <Card variant="layered" className="space-y-3">
                        <h3 className="typ-h3 !mb-0 !text-xl">Course Insights</h3>
                        <div className="space-y-2">
                            <div className="rounded-lg border border-border bg-card/70 px-3 py-2 flex items-center justify-between">
                                <span className="text-sm text-muted inline-flex items-center gap-2"><Users size={14} /> Active Students</span>
                                <span className="text-sm font-semibold text-gray-900">{isTeacher ? activeStudentsCount : '1.2k+'}</span>
                            </div>
                            <div className="rounded-lg border border-border bg-card/70 px-3 py-2 flex items-center justify-between">
                                <span className="text-sm text-muted inline-flex items-center gap-2"><CheckCircle2 size={14} /> Community Rating</span>
                                <span className="text-sm font-semibold text-gray-900">4.8/5</span>
                            </div>
                            <div className="rounded-lg border border-border bg-card/70 px-3 py-2 flex items-center justify-between">
                                <span className="text-sm text-muted inline-flex items-center gap-2"><Clock size={14} /> Total Content</span>
                                <span className="text-sm font-semibold text-gray-900">14 Hours</span>
                            </div>
                        </div>
                    </Card>

                    {isTeacher ? (
                        <Card variant="glass" className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="typ-h3 !mb-0 !text-xl">Enrolled Students</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="border border-border"
                                    onClick={() => navigate(`/app/course/${courseId}/students`)}
                                >
                                    View All
                                </Button>
                            </div>

                            {studentsLoading ? (
                                <div className="py-8 text-center text-sm text-muted">Loading students...</div>
                            ) : !enrolledStudents || enrolledStudents.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted">No students enrolled yet.</div>
                            ) : (
                                <div className="space-y-2">
                                    {enrolledStudents.slice(0, 8).map((student) => (
                                        <div key={student.id} className="rounded-xl border border-border bg-card/70 px-3 py-2">
                                            <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                                            <p className="text-xs text-muted">{student.email}</p>
                                            <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted">
                                                <span>Enrolled: {new Date(student.enrolledAt).toLocaleDateString()}</span>
                                                <span>Attempts: {student.quizAttempts}</span>
                                                <span>Avg Score: {student.averageScore}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ) : null}
                </div>
            </div>

            <Modal
                isOpen={Boolean(deleteQuizTarget)}
                onClose={() => {
                    if (!deleteQuizMutation.isPending) {
                        setDeleteQuizTarget(null);
                    }
                }}
                title="Delete Quiz"
                description="This will permanently remove the quiz, all questions, and attempt history for this quiz."
                footer={
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteQuizTarget(null)}
                            disabled={deleteQuizMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                if (deleteQuizTarget) {
                                    deleteQuizMutation.mutate(deleteQuizTarget.id);
                                }
                            }}
                            disabled={deleteQuizMutation.isPending}
                            className="bg-gradient-to-r from-error/55 to-error/30 border-error/60 hover:from-error/65 hover:to-error/45"
                        >
                            {deleteQuizMutation.isPending ? 'Deleting...' : 'Delete Quiz'}
                        </Button>
                    </div>
                }
            >
                <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3">
                    <p className="text-sm font-semibold text-error inline-flex items-center gap-2">
                        <AlertTriangle size={15} />
                        {deleteQuizTarget ? `"${deleteQuizTarget.title}" will be deleted permanently.` : 'Selected quiz will be deleted permanently.'}
                    </p>
                </div>
            </Modal>

            <Modal
                isOpen={isDeleteCourseOpen}
                onClose={() => {
                    if (!deleteCourseMutation.isPending) {
                        setIsDeleteCourseOpen(false);
                    }
                }}
                title="Delete Course"
                description="This removes the course and all associated lessons, problems, quizzes, enrollments, and materials."
                footer={
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteCourseOpen(false)}
                            disabled={deleteCourseMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => deleteCourseMutation.mutate()}
                            disabled={deleteCourseMutation.isPending}
                            className="bg-gradient-to-r from-error/60 to-error/35 border-error/70 hover:from-error/70 hover:to-error/50"
                        >
                            {deleteCourseMutation.isPending ? 'Deleting...' : 'Delete Course'}
                        </Button>
                    </div>
                }
            >
                <div className="rounded-xl border border-error/35 bg-error/12 px-4 py-3 space-y-2">
                    <p className="text-sm font-semibold text-error inline-flex items-center gap-2">
                        <AlertTriangle size={15} />
                        This action cannot be undone.
                    </p>
                    <p className="text-sm text-error/90">
                        Course: <span className="font-semibold">{course.title}</span>
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default CourseDetailPage;





