import type { ReactNode } from 'react';
import { Flame, LogOut } from 'lucide-react';
import { preloadRoute } from '../../utils/routePreload';

export interface SidebarItem {
    icon: ReactNode;
    label: string;
    path: string;
}

export interface SidebarSection {
    label: string;
    items: SidebarItem[];
}

interface SidebarUser {
    name: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

interface SidebarProps {
    collapsed: boolean;
    sections: SidebarSection[];
    isActive: (path: string) => boolean;
    onNavigate: (path: string) => void;
    onLogout: () => void;
    user: SidebarUser | null;
    horizontalNav?: boolean;
    streakDays?: number;
}

const Sidebar = ({
    collapsed,
    sections,
    isActive,
    onNavigate,
    onLogout,
    user,
    horizontalNav = false,
    streakDays = 0,
}: SidebarProps) => {
    const sidebarWidthClass = collapsed ? 'w-[5.25rem]' : 'w-72';
    const normalizedStudentStreak = Math.max(0, Math.floor(streakDays));
    const streakCount = user?.role === 'STUDENT' ? normalizedStudentStreak : 0;
    const streakFillSegments = Math.max(0, Math.min(6, Math.ceil(streakCount / 2)));

    return (
        <aside
            className={`sidebar-shell sidebar-ref-shell hidden md:flex h-full shrink-0 border-r border-border backdrop-blur-xl transition-[width] dur-normal ${sidebarWidthClass}`}
        >
            <div className="flex h-full w-full flex-col">
                <div className="flex h-20 items-center gap-3 px-5 border-b border-border/80">
                    <div className="brand-lockup brand-lockup-sidebar">
                        <span className="brand-mark">L</span>
                        {!collapsed && (
                            <span className="brand-wordmark">
                                <span className="brand-word-main">LEARN</span>
                                <span className="brand-word-sub">me</span>
                            </span>
                        )}
                    </div>
                </div>

                {!horizontalNav ? (
                    <>
                        <nav className="sidebar-nav-scroll flex-1 overflow-y-auto px-3 py-3">
                            <div className="sidebar-ref-nav-layout">
                                {sections.map((section) => (
                                    <div key={section.label} className={`sidebar-ref-section-block ${collapsed ? 'space-y-1.5' : 'space-y-2'}`}>
                                        {collapsed ? (
                                            <div className="mx-auto h-px w-7 rounded-full bg-border/80" />
                                        ) : (
                                            <p className="sidebar-ref-section-label px-2 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-muted/90">
                                                {section.label}
                                            </p>
                                        )}

                                        <div className={collapsed ? 'space-y-1.5' : 'sidebar-ref-items'}>
                                            {section.items.map((item) => {
                                                const active = isActive(item.path);
                                                return (
                                                    <button
                                                        key={item.path}
                                                        type="button"
                                                        onClick={() => onNavigate(item.path)}
                                                        onMouseEnter={() => preloadRoute(item.path)}
                                                        onFocus={() => preloadRoute(item.path)}
                                                        className={`sidebar-nav-item sidebar-ref-item group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all dur-fast ${
                                                            active ? 'sidebar-nav-item-active text-foreground' : 'text-muted hover:text-gray-800'
                                                        } ${collapsed ? 'justify-center px-2.5' : ''}`}
                                                    >
                                                        <span className="sidebar-nav-sheen" />
                                                        <span className="sidebar-nav-icon relative z-10">{item.icon}</span>
                                                        {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
                                                        {collapsed && <span className="sidebar-tooltip">{item.label}</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </nav>

                        <div className="p-3 border-t border-border/80 space-y-3">
                            {!collapsed && user?.role === 'STUDENT' && (
                                <div className="sidebar-ref-streak sidebar-streak-card rounded-xl border px-4 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <Flame size={16} className="sidebar-streak-icon" />
                                        <p className="sidebar-streak-kicker">Current Streak</p>
                                    </div>
                                    <p className="sidebar-streak-value">{streakCount} days</p>
                                    <div className="sidebar-streak-bar" aria-hidden="true">
                                        {[...Array(7)].map((_, idx) => (
                                            <span
                                                key={`streak-segment-${idx}`}
                                                className={`sidebar-streak-segment ${idx < streakFillSegments ? 'is-active' : ''}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="sidebar-streak-caption">Keep it going! 🔥</p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={onLogout}
                                className={`sidebar-logout-btn sidebar-ref-logout group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-error transition-all dur-fast hover:bg-error/10 ${
                                    collapsed ? 'justify-center px-2.5' : ''
                                }`}
                            >
                                <LogOut size={20} />
                                {!collapsed && <span>Logout</span>}
                                {collapsed && <span className="sidebar-tooltip">Logout</span>}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex-1" />
                        <div className="p-3 border-t border-border/80">
                            <button
                                type="button"
                                onClick={onLogout}
                                className={`sidebar-logout-btn group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-error transition-all dur-fast hover:bg-error/10 ${
                                    collapsed ? 'justify-center px-2.5' : ''
                                }`}
                            >
                                <LogOut size={20} />
                                {!collapsed && <span>Logout</span>}
                                {collapsed && <span className="sidebar-tooltip">Logout</span>}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
