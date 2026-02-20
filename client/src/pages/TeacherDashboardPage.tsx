import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, FileCode, TrendingUp, Plus, ArrowRight, Loader2, CheckCircle, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboard.service';

const TeacherDashboardPage = () => {
    const navigate = useNavigate();
    const { data: dashboard, isLoading } = useQuery({
        queryKey: ['teacher-dashboard'],
        queryFn: () => dashboardService.getTeacherData(),
    });

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-secondary font-medium">Aggregating your classroom insights...</p>
            </div>
        );
    }

    const stats = [
        { label: 'Published Courses', value: dashboard?.totalCourses || 0, icon: <BookOpen />, color: 'bg-primary/10 text-primary' },
        { label: 'Enrolled Students', value: dashboard?.totalStudents || 0, icon: <Users />, color: 'bg-accent-blue/10 text-accent-blue' },
        { label: 'Code Submissions', value: dashboard?.totalSubmissions || 0, icon: <FileCode />, color: 'bg-yellow-50 text-yellow-600' },
        { label: 'Active Learners', value: dashboard?.activeStudents || 0, icon: <TrendingUp />, color: 'bg-green-50 text-green-600' },
    ];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-headlines">Teacher Control Center</h1>
                    <p className="text-secondary mt-1 font-medium">Manage your courses and track student success metrics.</p>
                </div>
                <button
                    onClick={() => navigate('/app/courses/create')}
                    className="btn-gradient flex items-center gap-2 px-8 py-4 text-lg shadow-lg hover:shadow-primary/20"
                >
                    <Plus size={24} />
                    Create New Course
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="card-premium group hover:border-primary/20 cursor-default">
                        <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            {stat.icon}
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-4xl font-extrabold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Courses Management */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold font-headlines">Your Courses</h2>
                        <Link to="/app/courses" className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {dashboard?.courses.map((course) => (
                            <div
                                key={course.id}
                                onClick={() => navigate(`/app/course/${course.id}`)}
                                className="card-premium group hover:bg-gray-50 transition-all cursor-pointer"
                            >
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{course.title}</h3>
                                <div className="mt-4 flex items-center gap-6 text-sm text-secondary font-medium">
                                    <span className="flex items-center gap-2"><Users size={16} /> {course.studentCount} Students</span>
                                    <span className="flex items-center gap-2"><BookOpen size={16} /> {course.lessonCount} Lessons</span>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button className="p-2 bg-white rounded-xl shadow-soft text-gray-400 group-hover:text-primary transition-colors">
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Submissions Activity */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold font-headlines">Recent Submissions</h2>
                    <div className="card-premium space-y-6">
                        {dashboard?.recentSubmissions.map((sub) => (
                            <div key={sub.id} className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sub.status === 'ACCEPTED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                    {sub.status === 'ACCEPTED' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{sub.studentName}</p>
                                    <p className="text-xs text-secondary truncate font-medium">{sub.problemTitle}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {(!dashboard?.recentSubmissions || dashboard.recentSubmissions.length === 0) && (
                            <div className="text-center py-10 opacity-50 space-y-4">
                                <FileCode size={48} className="mx-auto" />
                                <p className="font-medium">No activity recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboardPage;
