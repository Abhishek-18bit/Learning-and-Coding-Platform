import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Loader2, Search, Users } from 'lucide-react';
import { courseService } from '../services/course.service';
import { useAuth } from '../contexts/AuthContext';

const PAGE_SIZE = 10;

const TeacherCourseStudentsPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const courseQuery = useQuery({
        queryKey: ['course', courseId, 'students-view'],
        queryFn: () => courseService.getById(courseId!),
        enabled: Boolean(courseId),
    });

    const studentsQuery = useQuery({
        queryKey: ['course-students', courseId, 'full'],
        queryFn: () => courseService.getEnrolledStudents(courseId!),
        enabled: Boolean(courseId),
    });

    const filteredStudents = useMemo(() => {
        const normalized = search.trim().toLowerCase();
        const source = studentsQuery.data || [];
        if (!normalized) return source;

        return source.filter((student) =>
            student.name.toLowerCase().includes(normalized) ||
            student.email.toLowerCase().includes(normalized)
        );
    }, [studentsQuery.data, search]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pagedStudents = filteredStudents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const exportCsv = () => {
        const rows = [
            ['Name', 'Email', 'Enrolled At', 'Quiz Attempts', 'Average Score'],
            ...filteredStudents.map((student) => [
                student.name,
                student.email,
                new Date(student.enrolledAt).toISOString(),
                String(student.quizAttempts),
                String(student.averageScore),
            ]),
        ];

        const csv = rows
            .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `course-${courseId}-students.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') return <Navigate to="/app/dashboard" replace />;

    if (courseQuery.isLoading || studentsQuery.isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-secondary">Loading enrolled students...</p>
            </div>
        );
    }

    if (courseQuery.isError || !courseQuery.data) {
        return (
            <div className="max-w-3xl mx-auto rounded-2xl border border-red-100 bg-red-50 p-6">
                <p className="text-red-700 font-semibold">Failed to load course details.</p>
                <button
                    onClick={() => navigate('/app/courses')}
                    className="mt-3 text-xs font-bold uppercase tracking-widest text-primary hover:underline"
                >
                    Back to courses
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate(`/app/course/${courseId}`)}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:underline"
                    >
                        <ArrowLeft size={14} />
                        Back to course
                    </button>
                    <h1 className="text-3xl font-bold font-headlines text-gray-900">Enrolled Students</h1>
                    <p className="text-secondary">{courseQuery.data.title}</p>
                </div>

                <button
                    onClick={exportCsv}
                    disabled={filteredStudents.length === 0}
                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                    <Download size={14} />
                    Export CSV
                </button>
            </div>

            <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-soft">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder="Search by student name or email"
                        className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-soft">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                    <div className="inline-flex items-center gap-2 text-gray-900 font-bold">
                        <Users size={16} />
                        {filteredStudents.length} students
                    </div>
                    <span className="text-xs text-secondary font-semibold">
                        Page {safePage} of {totalPages}
                    </span>
                </div>

                {studentsQuery.isError ? (
                    <p className="text-sm text-red-600">Failed to fetch enrolled students.</p>
                ) : pagedStudents.length === 0 ? (
                    <p className="text-sm text-secondary">No students found for this filter.</p>
                ) : (
                    <div className="space-y-3">
                        {pagedStudents.map((student) => (
                            <div key={student.id} className="rounded-xl border border-gray-100 p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-gray-900">{student.name}</p>
                                        <p className="text-sm text-secondary">{student.email}</p>
                                    </div>
                                    <div className="text-xs text-secondary font-semibold flex flex-wrap gap-3">
                                        <span>Enrolled: {new Date(student.enrolledAt).toLocaleDateString()}</span>
                                        <span>Attempts: {student.quizAttempts}</span>
                                        <span>Avg Score: {student.averageScore}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            disabled={safePage === 1}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                            disabled={safePage === totalPages}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
};

export default TeacherCourseStudentsPage;
