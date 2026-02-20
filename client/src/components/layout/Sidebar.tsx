import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { preloadRoute } from '../../utils/routePreload';

export interface SidebarItem {
    icon: ReactNode;
    label: string;
    path: string;
}

interface SidebarProps {
    collapsed: boolean;
    items: SidebarItem[];
    bottomItems: SidebarItem[];
    isActive: (path: string) => boolean;
    onNavigate: (path: string) => void;
    onLogout: () => void;
}

const Sidebar = ({
    collapsed,
    items,
    bottomItems,
    isActive,
    onNavigate,
    onLogout,
}: SidebarProps) => {
    const sidebarWidthClass = collapsed ? 'w-20' : 'w-72';

    return (
        <aside
            className={`hidden md:flex h-screen sticky top-0 shrink-0 border-r border-border bg-surface/95 backdrop-blur-xl transition-[width] dur-normal ${sidebarWidthClass}`}
        >
            <div className="flex h-full w-full flex-col">
                <div className="flex h-20 items-center gap-3 px-5 border-b border-border/80">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-cyan via-primary-blue to-primary-violet text-white font-bold shadow-soft">
                        L
                        <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/20" />
                    </div>
                    {!collapsed && <span className="typ-h3 mb-0 text-gray-900">LEARNme</span>}
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
                    {items.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <button
                                key={item.path}
                                type="button"
                                onClick={() => onNavigate(item.path)}
                                onMouseEnter={() => preloadRoute(item.path)}
                                onFocus={() => preloadRoute(item.path)}
                                title={collapsed ? item.label : undefined}
                                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all dur-fast ${
                                    active ? 'text-foreground' : 'text-muted hover:text-gray-800'
                                }`}
                            >
                                {active && (
                                    <>
                                        <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-primary-cyan/15 via-primary-blue/15 to-primary-violet/15" />
                                        <span className="pointer-events-none absolute left-0 top-2 bottom-2 w-1 rounded-r bg-gradient-to-b from-primary-cyan via-primary-blue to-primary-violet shadow-medium" />
                                    </>
                                )}
                                <span className="relative z-10">{item.icon}</span>
                                {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
                            </button>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-border/80 space-y-2">
                        {bottomItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <button
                                    key={item.path}
                                    type="button"
                                    onClick={() => onNavigate(item.path)}
                                    onMouseEnter={() => preloadRoute(item.path)}
                                    onFocus={() => preloadRoute(item.path)}
                                    title={collapsed ? item.label : undefined}
                                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all dur-fast ${
                                        active ? 'text-foreground' : 'text-muted hover:text-gray-800'
                                    }`}
                                >
                                    {active && (
                                        <>
                                            <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-primary-cyan/15 via-primary-blue/15 to-primary-violet/15" />
                                            <span className="pointer-events-none absolute left-0 top-2 bottom-2 w-1 rounded-r bg-gradient-to-b from-primary-cyan via-primary-blue to-primary-violet shadow-medium" />
                                        </>
                                    )}
                                    <span className="relative z-10">{item.icon}</span>
                                    {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                <div className="p-3 border-t border-border/80">
                    <button
                        type="button"
                        onClick={onLogout}
                        title={collapsed ? 'Logout' : undefined}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-error transition-all dur-fast hover:bg-error/10"
                    >
                        <LogOut size={20} />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
