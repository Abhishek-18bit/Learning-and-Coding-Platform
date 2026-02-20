import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BookOpenCheck, FileText, PenSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const QuizCreationHubPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="text-secondary font-medium">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
        return <Navigate to="/app/dashboard" replace />;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold font-headlines text-gray-900">Create Quiz</h1>
                <p className="text-secondary">Choose how you want to create assessments for this course.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                    onClick={() => navigate(`/app/course/${courseId}/quiz/create/manual`)}
                    className="text-left rounded-3xl border border-gray-100 bg-white p-7 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all"
                >
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                        <PenSquare size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Manual Builder</h2>
                    <p className="text-sm text-secondary mt-2">
                        Build each question manually with full control over options, answers, and explanations.
                    </p>
                </button>

                <button
                    onClick={() => navigate(`/app/course/${courseId}/quiz/create/lesson-ai`)}
                    className="text-left rounded-3xl border border-gray-100 bg-white p-7 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all"
                >
                    <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 text-accent-blue flex items-center justify-center mb-5">
                        <BookOpenCheck size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Generate from Lesson (AI)</h2>
                    <p className="text-sm text-secondary mt-2">
                        Pick a lesson and generate an editable quiz draft from lesson content using AI.
                    </p>
                </button>

                <button
                    onClick={() => navigate(`/app/course/${courseId}/quiz/create/pdf-ai`)}
                    className="text-left rounded-3xl border border-gray-100 bg-white p-7 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all"
                >
                    <div className="w-12 h-12 rounded-2xl bg-accent-red/10 text-accent-red flex items-center justify-center mb-5">
                        <FileText size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Generate from PDF (AI)</h2>
                    <p className="text-sm text-secondary mt-2">
                        Select uploaded PDF material and generate an editable quiz draft using backend AI extraction.
                    </p>
                </button>
            </div>
        </div>
    );
};

export default QuizCreationHubPage;
