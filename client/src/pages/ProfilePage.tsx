import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Calendar, Edit3, Loader2 } from 'lucide-react';

const ProfilePage = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-secondary font-medium">Loading your profile...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="card-premium p-20 text-center max-w-2xl mx-auto mt-10">
                <h2 className="text-2xl font-bold">Please login to view profile</h2>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Profile Header */}
            <div className="relative rounded-[3rem] bg-white p-12 shadow-soft border border-gray-100 flex flex-col md:flex-row items-center gap-10">
                <div className="w-40 h-40 bg-gradient-to-tr from-primary to-primary-light rounded-[2.5rem] flex items-center justify-center text-white text-6xl font-black shadow-xl">
                    {user.name.charAt(0)}
                </div>

                <div className="flex-grow text-center md:text-left space-y-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 font-headlines">{user.name}</h1>
                        <p className="text-lg text-secondary font-medium mt-1">{user.email}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                        <span className="px-4 py-1.5 bg-primary/5 text-primary rounded-full text-xs font-bold uppercase tracking-widest border border-primary/10 flex items-center gap-2">
                            <Shield size={14} />
                            {user.role}
                        </span>
                        <span className="px-4 py-1.5 bg-gray-50 text-secondary rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} />
                            Joined {new Date().toLocaleDateString()}
                        </span>
                    </div>
                </div>

                <button className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2">
                    <Edit3 size={18} />
                    Edit Profile
                </button>
            </div>

            {/* Account Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card-premium space-y-8">
                    <h3 className="text-xl font-bold font-headlines">Personal Information</h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Full Name</p>
                                <p className="font-bold text-gray-900">{user.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Email Address</p>
                                <p className="font-bold text-gray-900">{user.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-premium space-y-8">
                    <h3 className="text-xl font-bold font-headlines">Privacy & Security</h3>
                    <div className="space-y-4">
                        <button className="w-full p-6 bg-gray-50 hover:bg-white hover:shadow-medium border-2 border-transparent hover:border-gray-100 rounded-2xl text-left transition-all group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-900">Change Password</h4>
                                    <p className="text-xs text-secondary mt-1">Recommended for better security.</p>
                                </div>
                                <ChevronRight size={20} className="text-gray-300 group-hover:text-primary transition-all" />
                            </div>
                        </button>

                        <button className="w-full p-6 bg-red-50 hover:bg-red-100/30 rounded-2xl text-left transition-all group">
                            <h4 className="font-bold text-accent-red">Deactivate Account</h4>
                            <p className="text-xs text-accent-red/60 mt-1">Permanently delete all your data.</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

// Placeholder for ChevronRight
const ChevronRight = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m9 18 6-6-6-6" />
    </svg>
);
