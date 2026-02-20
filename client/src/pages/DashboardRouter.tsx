import { useAuth } from '../contexts/AuthContext';
import DashboardPage from './DashboardPage';
import TeacherDashboardPage from './TeacherDashboardPage';
import { Loader2 } from 'lucide-react';

const DashboardRouter = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-secondary font-medium">Authenticating experience...</p>
            </div>
        );
    }

    if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
        return <TeacherDashboardPage />;
    }

    return <DashboardPage />;
};

export default DashboardRouter;
