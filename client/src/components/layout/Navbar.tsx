import { Bell, CalendarDays, ChevronLeft, ChevronRight, LogOut, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import type { ReactNode } from 'react';

interface NavbarUser {
    name: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

interface NavbarNavItem {
    icon: ReactNode;
    label: string;
    path: string;
}

interface NavbarProps {
    title: string;
    showTitle?: boolean;
    collapsed: boolean;
    showSidebarToggle?: boolean;
    showBrand?: boolean;
    showTopNavStrip?: boolean;
    onToggleSidebar: () => void;
    onLogout: () => void;
    user: NavbarUser | null;
    navItems: NavbarNavItem[];
    isActive: (path: string) => boolean;
    onNavigate: (path: string) => void;
}

const Navbar = ({
    title,
    showTitle = true,
    collapsed,
    showSidebarToggle = true,
    showBrand = false,
    showTopNavStrip = true,
    onToggleSidebar,
    onLogout,
    user,
    navItems,
    isActive,
    onNavigate,
}: NavbarProps) => {
    const getToneClassByPath = (path: string) => {
        if (path.startsWith('/app/dashboard')) return 'top-nav-chip-tone-0';
        if (path.startsWith('/app/courses/create')) return 'top-nav-chip-tone-2';
        if (path.startsWith('/app/courses')) return 'top-nav-chip-tone-3';
        if (path.startsWith('/app/quizzes/manage')) return 'top-nav-chip-tone-2';
        if (path.startsWith('/app/quizzes')) return 'top-nav-chip-tone-3';
        if (path.startsWith('/app/submissions')) return 'top-nav-chip-tone-1';
        if (path.startsWith('/app/problems')) return 'top-nav-chip-tone-1';
        if (path.startsWith('/app/battle')) return 'top-nav-chip-tone-4';
        if (path.startsWith('/app/achievements')) return 'top-nav-chip-tone-2';
        if (path.startsWith('/app/practice')) return 'top-nav-chip-tone-0';
        if (path.startsWith('/app/about')) return 'top-nav-chip-tone-3';
        if (path.startsWith('/app/profile')) return 'top-nav-chip-tone-4';
        return 'top-nav-chip-tone-1';
    };

    return (
        <header className="app-navbar-ref sticky top-0 z-20 h-20 border-b border-border/80 bg-surface/70 backdrop-blur-xl">
            <div className="h-full w-full px-3 lg:px-4 flex items-center gap-3">
                <div className="flex shrink-0 min-w-0 items-center gap-3">
                    {showSidebarToggle && (
                        <button
                            type="button"
                            onClick={onToggleSidebar}
                            className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-gray-700 transition-all dur-fast hover:bg-surface-elevated"
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                        </button>
                    )}
                    {showBrand && (
                        <div className="navbar-brand-shell hidden lg:flex items-center pr-4">
                            <div className="brand-lockup brand-lockup-navbar" aria-label="LEARNme">
                                <span className="brand-mark">L</span>
                                <span className="brand-wordmark">
                                    <span className="brand-word-main">LEARN</span>
                                    <span className="brand-word-sub">me</span>
                                </span>
                            </div>
                        </div>
                    )}
                    {showTitle && <h2 className="typ-h3 mb-0 truncate text-gray-900">{title}</h2>}
                </div>

                <div className="hidden lg:flex min-w-0 flex-1 px-2">
                    {showTopNavStrip ? (
                        <div className="top-nav-strip-wrap hidden min-w-0 flex-1 px-2 xl:flex">
                            <div className="top-nav-strip grid min-w-0 w-full grid-flow-col auto-cols-fr items-center gap-2">
                                {navItems.map((item) => {
                                    const active = isActive(item.path);
                                    const toneClass = getToneClassByPath(item.path);
                                    return (
                                        <button
                                            key={item.path}
                                            type="button"
                                            onClick={() => onNavigate(item.path)}
                                            className={`top-nav-chip ${toneClass} group inline-flex min-w-0 w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition-all dur-fast ${
                                                active ? 'top-nav-chip-active text-gray-900' : 'text-muted hover:text-gray-700'
                                            }`}
                                        >
                                            <span className="top-nav-chip-icon">{item.icon}</span>
                                            <span className="truncate">{item.label}</span>
                                        </button>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={onLogout}
                                    className="top-nav-chip top-nav-chip-danger group inline-flex min-w-0 w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-error transition-all dur-fast"
                                    aria-label="Logout"
                                >
                                    <span className="top-nav-chip-icon">
                                        <LogOut size={14} />
                                    </span>
                                    <span className="truncate">Logout</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="navbar-search-shell">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search problems, courses..."
                                aria-label="Search"
                                className="navbar-search-input"
                            />
                            <span className="navbar-search-shortcut">Ctrl+K</span>
                        </div>
                    )}
                </div>

                <div className="hidden md:flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        className="navbar-bell-btn relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition-all dur-fast"
                        aria-label="Notifications"
                    >
                        <Bell size={18} />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
                    </button>
                    <button
                        type="button"
                        className="navbar-bell-btn relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition-all dur-fast"
                        aria-label="Calendar"
                    >
                        <CalendarDays size={18} />
                    </button>

                    <div className="navbar-user-shell flex items-center gap-3">
                        <div className="text-right leading-tight">
                            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Guest User'}</p>
                            <p className="typ-muted !leading-4 capitalize">{user?.role?.toLowerCase() || 'anonymous'}</p>
                        </div>
                        <div className="navbar-user-avatar relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-900 font-bold">
                            {user?.name?.charAt(0) || '?'}
                            <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-border/70" />
                        </div>
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
                        <button
                            type="button"
                            onClick={onLogout}
                            className="h-8 w-8 rounded-lg text-error hover:bg-error/10 transition-colors"
                            aria-label="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;

