import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    User,
    Mail,
    Shield,
    ShieldCheck,
    Calendar,
    Edit3,
    Loader2,
    Sparkles,
    BadgeCheck,
    Trophy,
    KeyRound,
    Trash2,
    ChevronRight,
    Lock,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { userService } from '../services/user.service';

const ProfilePage = () => {
    const { user, loading, updateUser } = useAuth();
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '' });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [editErrors, setEditErrors] = useState<{ name?: string; email?: string }>({});
    const [passwordErrors, setPasswordErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});

    const roleTone = {
        STUDENT: 'text-primary-cyan border-primary-cyan/40 bg-primary-cyan/10',
        TEACHER: 'text-success border-success/40 bg-success/10',
        ADMIN: 'text-warning border-warning/40 bg-warning/10'
    } as const;

    const joinedDate = useMemo(() => {
        if (!user?.createdAt) {
            return new Date().toLocaleDateString();
        }
        return new Date(user.createdAt).toLocaleDateString();
    }, [user?.createdAt]);

    const openEditModal = () => {
        if (!user) return;
        setEditForm({ name: user.name, email: user.email });
        setEditErrors({});
        setIsEditModalOpen(true);
    };

    const openPasswordModal = () => {
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setPasswordErrors({});
        setIsPasswordModalOpen(true);
    };

    const handleEditSave = async () => {
        const nextErrors: { name?: string; email?: string } = {};
        if (editForm.name.trim().length < 2) {
            nextErrors.name = 'Name must be at least 2 characters';
        }
        if (!editForm.email.trim()) {
            nextErrors.email = 'Email is required';
        } else if (!/^\S+@\S+\.\S+$/.test(editForm.email.trim())) {
            nextErrors.email = 'Enter a valid email address';
        }

        if (Object.keys(nextErrors).length > 0) {
            setEditErrors(nextErrors);
            return;
        }

        try {
            setEditSaving(true);
            setFeedback(null);
            const response = await userService.updateProfile({
                name: editForm.name.trim(),
                email: editForm.email.trim(),
            });
            updateUser(response.user);
            setIsEditModalOpen(false);
            setFeedback({ type: 'success', message: response.message || 'Profile updated successfully.' });
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
            setFeedback({ type: 'error', message: message || 'Could not update profile. Please try again.' });
        } finally {
            setEditSaving(false);
        }
    };

    const handlePasswordSave = async () => {
        const nextErrors: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};

        if (!passwordForm.currentPassword) {
            nextErrors.currentPassword = 'Current password is required';
        }
        if (passwordForm.newPassword.length < 6) {
            nextErrors.newPassword = 'New password must be at least 6 characters';
        }
        if (passwordForm.confirmPassword !== passwordForm.newPassword) {
            nextErrors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(nextErrors).length > 0) {
            setPasswordErrors(nextErrors);
            return;
        }

        try {
            setPasswordSaving(true);
            setFeedback(null);
            const response = await userService.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setIsPasswordModalOpen(false);
            setFeedback({ type: 'success', message: response.message || 'Password changed successfully.' });
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
            setFeedback({ type: 'error', message: message || 'Could not change password. Please try again.' });
        } finally {
            setPasswordSaving(false);
        }
    };

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
        <div className="mx-auto w-full max-w-[120rem] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {feedback && (
                <div
                    className={`rounded-xl border px-4 py-3 text-sm font-medium inline-flex items-center gap-2 ${feedback.type === 'success'
                        ? 'border-success/40 bg-success/10 text-success'
                        : 'border-error/40 bg-error/10 text-error'
                        }`}
                >
                    {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {feedback.message}
                </div>
            )}

            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-medium">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(168,85,247,0.08),transparent_46%),radial-gradient(circle_at_88%_0%,rgba(34,211,238,0.1),transparent_42%),radial-gradient(circle_at_75%_85%,rgba(16,185,129,0.07),transparent_38%)]" />
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-primary-blue/30" />
                <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full border border-primary-cyan/20" />

                <div className="relative z-10 p-8 md:p-10">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                            <div className="relative">
                                <div className="h-32 w-32 rounded-[1.8rem] border border-primary-blue/35 bg-gradient-to-br from-primary-cyan/85 via-primary-blue to-success/80 text-6xl font-black text-white shadow-strong flex items-center justify-center">
                                    {user.name.charAt(0)}
                                </div>
                                <span className="absolute -right-1 -top-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-success">
                                    <BadgeCheck size={14} />
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="mission-kicker w-fit">
                                        <Sparkles size={12} />
                                        PROFILE COMMAND CENTER
                                    </p>
                                    <h1 className="mt-2 text-4xl font-black font-headlines text-gray-900">{user.name}</h1>
                                    <p className="text-lg text-secondary font-medium mt-1">{user.email}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] border inline-flex items-center gap-2 ${roleTone[user.role]}`}>
                                        <Shield size={14} />
                                        {user.role}
                                    </span>
                                    <span className="px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] border border-border bg-surface text-gray-700 inline-flex items-center gap-2">
                                        <Calendar size={14} />
                                        Joined {joinedDate}
                                    </span>
                                    <span className="px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] border border-success/35 bg-success/10 text-success inline-flex items-center gap-2">
                                        <ShieldCheck size={14} />
                                        Secure
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={openEditModal}
                            className="btn-gradient px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <Edit3 size={18} />
                            Edit Profile
                        </button>
                    </div>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-border bg-surface/80 p-4">
                            <p className="text-[11px] uppercase tracking-[0.15em] text-muted font-bold">Profile Strength</p>
                            <p className="mt-2 text-2xl font-black text-gray-900">98%</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface/80 p-4">
                            <p className="text-[11px] uppercase tracking-[0.15em] text-muted font-bold">Trust Score</p>
                            <p className="mt-2 text-2xl font-black text-gray-900">A+</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface/80 p-4">
                            <p className="text-[11px] uppercase tracking-[0.15em] text-muted font-bold">Account Status</p>
                            <p className="mt-2 text-2xl font-black text-success">Active</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <section className="xl:col-span-2 card-premium space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold font-headlines">Personal Information</h3>
                        <span className="text-xs text-muted uppercase tracking-[0.14em] font-bold">Identity Verified</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-border bg-surface p-4 flex items-center gap-4">
                            <span className="h-11 w-11 rounded-xl border border-border bg-card flex items-center justify-center text-primary-cyan">
                                <User size={20} />
                            </span>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Full Name</p>
                                <p className="font-bold text-gray-900 mt-1">{user.name}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-surface p-4 flex items-center gap-4">
                            <span className="h-11 w-11 rounded-xl border border-border bg-card flex items-center justify-center text-primary-blue">
                                <Mail size={20} />
                            </span>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Email Address</p>
                                <p className="font-bold text-gray-900 mt-1 break-all">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface p-5">
                        <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-muted mb-4">Profile Highlights</h4>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1.5 rounded-full border border-primary-blue/35 bg-primary-blue/10 text-primary-blue text-xs font-semibold inline-flex items-center gap-1.5">
                                <Trophy size={14} />
                                Top Learner
                            </span>
                            <span className="px-3 py-1.5 rounded-full border border-success/35 bg-success/10 text-success text-xs font-semibold inline-flex items-center gap-1.5">
                                <ShieldCheck size={14} />
                                Security Enabled
                            </span>
                            <span className="px-3 py-1.5 rounded-full border border-primary-cyan/35 bg-primary-cyan/10 text-primary-cyan text-xs font-semibold inline-flex items-center gap-1.5">
                                <Sparkles size={14} />
                                Profile Optimized
                            </span>
                        </div>
                    </div>
                </section>

                <section className="card-premium space-y-4">
                    <h3 className="text-xl font-bold font-headlines">Privacy & Security</h3>

                    <button
                        onClick={openPasswordModal}
                        className="w-full rounded-2xl border border-border bg-surface p-5 text-left transition-all group hover:border-primary-blue/45 hover:bg-surface-elevated"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <span className="h-10 w-10 rounded-xl border border-border bg-card flex items-center justify-center text-primary-blue shrink-0">
                                    <KeyRound size={18} />
                                </span>
                                <div>
                                    <h4 className="font-bold text-gray-900">Change Password</h4>
                                    <p className="text-xs text-secondary mt-1">Recommended for better account protection.</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-muted group-hover:text-primary-blue transition-colors" />
                        </div>
                    </button>

                    <button className="w-full rounded-2xl border border-error/45 bg-error/10 p-5 text-left transition-all group hover:bg-error/15">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <span className="h-10 w-10 rounded-xl border border-error/45 bg-error/10 flex items-center justify-center text-error shrink-0">
                                    <Trash2 size={18} />
                                </span>
                                <div>
                                    <h4 className="font-bold text-error">Deactivate Account</h4>
                                    <p className="text-xs text-error/80 mt-1">Permanently delete all profile data.</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-error/80 group-hover:text-error transition-colors" />
                        </div>
                    </button>
                </section>
            </div>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Profile"
                description="Update your account details."
                footer={
                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} disabled={editSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditSave} disabled={editSaving}>
                            {editSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="label-base mb-1.5 block">Full Name</label>
                        <input
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="input-base"
                            placeholder="Enter full name"
                        />
                        {editErrors.name && <p className="mt-1 text-xs text-error">{editErrors.name}</p>}
                    </div>
                    <div>
                        <label className="label-base mb-1.5 block">Email Address</label>
                        <input
                            value={editForm.email}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                            className="input-base"
                            placeholder="you@example.com"
                        />
                        {editErrors.email && <p className="mt-1 text-xs text-error">{editErrors.email}</p>}
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title="Change Password"
                description="Use a strong password to protect your account."
                footer={
                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                        <Button variant="ghost" onClick={() => setIsPasswordModalOpen(false)} disabled={passwordSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handlePasswordSave} disabled={passwordSaving}>
                            {passwordSaving ? 'Updating...' : 'Update Password'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="label-base mb-1.5 block">Current Password</label>
                        <div className="relative">
                            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                className="input-base pl-10"
                                placeholder="Current password"
                            />
                        </div>
                        {passwordErrors.currentPassword && <p className="mt-1 text-xs text-error">{passwordErrors.currentPassword}</p>}
                    </div>

                    <div>
                        <label className="label-base mb-1.5 block">New Password</label>
                        <div className="relative">
                            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                className="input-base pl-10"
                                placeholder="Minimum 6 characters"
                            />
                        </div>
                        {passwordErrors.newPassword && <p className="mt-1 text-xs text-error">{passwordErrors.newPassword}</p>}
                    </div>

                    <div>
                        <label className="label-base mb-1.5 block">Confirm New Password</label>
                        <div className="relative">
                            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                className="input-base pl-10"
                                placeholder="Re-enter new password"
                            />
                        </div>
                        {passwordErrors.confirmPassword && <p className="mt-1 text-xs text-error">{passwordErrors.confirmPassword}</p>}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProfilePage;


