import { Bell, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface NavbarUser {
    name: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

interface NavbarProps {
    title: string;
    collapsed: boolean;
    onToggleSidebar: () => void;
    user: NavbarUser | null;
}

const Navbar = ({ title, collapsed, onToggleSidebar, user }: NavbarProps) => {
    return (
        <header className="sticky top-0 z-20 h-20 border-b border-border/80 bg-surface/70 backdrop-blur-xl">
            <div className="mx-auto h-full w-full max-w-screen-2xl px-6 lg:px-8 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-gray-700 transition-all dur-fast hover:bg-surface-elevated"
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                    <h2 className="typ-h3 mb-0 truncate text-gray-900">{title}</h2>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-gray-700 transition-all dur-fast hover:bg-surface-elevated"
                        aria-label="Notifications"
                    >
                        <Bell size={18} />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
                    </button>

                    <div className="hidden md:flex items-center gap-3 border-l border-border/80 pl-4">
                        <div className="text-right leading-tight">
                            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Guest User'}</p>
                            <p className="typ-muted !leading-4 capitalize">{user?.role?.toLowerCase() || 'anonymous'}</p>
                        </div>
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-cyan/20 via-primary-blue/20 to-primary-violet/20 text-gray-900 font-bold">
                            {user?.name?.charAt(0) || '?'}
                            <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-border/70" />
                        </div>
                    </div>

                    <div className="md:hidden inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1">
                        <button
                            type="button"
                            className="h-8 w-8 rounded-lg text-gray-700 hover:bg-surface-elevated transition-colors"
                            aria-label="Back"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            className="h-8 w-8 rounded-lg text-gray-700 hover:bg-surface-elevated transition-colors"
                            aria-label="Forward"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
