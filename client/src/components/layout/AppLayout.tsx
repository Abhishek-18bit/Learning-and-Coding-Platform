import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, BookOpen, ClipboardCheck, Code2, IdCard, LayoutDashboard, PenTool, Swords, UserCircle, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { pageTransition } from '../../animations/variants';
import ContentWrapper from './ContentWrapper';
import Sidebar, { type SidebarItem, type SidebarSection } from './Sidebar';
import Navbar from './Navbar';
import { preloadRoute } from '../../utils/routePreload';
import RouteTransitionLayer from './RouteTransitionLayer';
import { dashboardService } from '../../services/dashboard.service';

const SIDEBAR_STORAGE_KEY = 'app_sidebar_collapsed';

const AppLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const [collapsed, setCollapsed] = useState<boolean>(() => {
        const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        return stored === '1';
    });

    useEffect(() => {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0');
    }, [collapsed]);

    useEffect(() => {
        const prevHtmlOverflow = document.documentElement.style.overflow;
        const prevBodyOverflow = document.body.style.overflow;

        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        return () => {
            document.documentElement.style.overflow = prevHtmlOverflow;
            document.body.style.overflow = prevBodyOverflow;
        };
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }

        const likelyNextPaths = (user.role === 'TEACHER' || user.role === 'ADMIN')
            ? ['/app/dashboard', '/app/courses', '/app/problems', '/app/quizzes/manage', '/app/battle', '/app/about']
            : ['/app/dashboard', '/app/courses', '/app/problems', '/app/quizzes', '/app/battle', '/app/achievements', '/app/about'];

        const timeoutId = window.setTimeout(() => {
            likelyNextPaths.forEach((path) => preloadRoute(path));
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [user?.role]);

    const { data: studentDashboard } = useQuery({
        queryKey: ['student-dashboard'],
        queryFn: () => dashboardService.getStudentData(),
        enabled: Boolean(user && user.role === 'STUDENT'),
        staleTime: 60_000,
    });

    const studentItems: SidebarItem[] = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/app/dashboard' },
        { icon: <BookOpen size={20} />, label: 'Courses', path: '/app/courses' },
        { icon: <Code2 size={20} />, label: 'Problems', path: '/app/problems' },
        { icon: <Swords size={20} />, label: 'Battle Arena', path: '/app/battle' },
        { icon: <Award size={20} />, label: 'Achievements', path: '/app/achievements' },
        { icon: <PenTool size={20} />, label: 'Practice', path: '/app/practice' },
        { icon: <ClipboardCheck size={20} />, label: 'Quizzes', path: '/app/quizzes' },
        { icon: <ClipboardCheck size={20} />, label: 'Submissions', path: '/app/submissions' },
    ];

    const teacherItems: SidebarItem[] = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/app/dashboard' },
        { icon: <BookOpen size={20} />, label: 'My Courses', path: '/app/courses' },
        { icon: <Code2 size={20} />, label: 'Problems', path: '/app/problems' },
        { icon: <Swords size={20} />, label: 'Battle Rooms', path: '/app/battle' },
        { icon: <ClipboardCheck size={20} />, label: 'My Quizzes', path: '/app/quizzes/manage' },
        { icon: <Users size={20} />, label: 'Create Course', path: '/app/courses/create' },
    ];

    const personalItems: SidebarItem[] = [
        { icon: <IdCard size={20} />, label: 'About', path: '/app/about' },
        { icon: <UserCircle size={20} />, label: 'Profile', path: '/app/profile' },
    ];

    const sidebarSections: SidebarSection[] = user?.role === 'TEACHER' || user?.role === 'ADMIN'
        ? [
            {
                label: 'Learning',
                items: [teacherItems[0], teacherItems[1], teacherItems[4], teacherItems[5]],
            },
            {
                label: 'Compete',
                items: [teacherItems[2], teacherItems[3]],
            },
            {
                label: 'Personal',
                items: personalItems,
            },
        ]
        : [
            {
                label: 'Learning',
                items: [studentItems[0], studentItems[1], studentItems[6], studentItems[7]],
            },
            {
                label: 'Compete',
                items: [studentItems[2], studentItems[3], studentItems[4], studentItems[5]],
            },
            {
                label: 'Personal',
                items: personalItems,
            },
        ];

    const topNavItems = sidebarSections.flatMap((section) => section.items);

    const isActive = (path: string) => {
        if (path === '/app/quizzes/manage') {
            return location.pathname === '/app/quizzes/manage' || /^\/app\/quizzes\/[^/]+\/manage$/.test(location.pathname);
        }
        if (path === '/app/problems') {
            return (
                location.pathname === '/app/problems' ||
                /^\/app\/problem\/[^/]+$/.test(location.pathname) ||
                /^\/app\/lesson\/[^/]+\/problem\/create$/.test(location.pathname) ||
                /^\/app\/course\/[^/]+\/problem\/create$/.test(location.pathname)
            );
        }
        if (path === '/app/battle') {
            return location.pathname === '/app/battle' || /^\/app\/battle\/[^/]+$/.test(location.pathname);
        }
        return location.pathname === path;
    };

    const pageTitle = useMemo(() => {
        const routeMap: Array<{ match: RegExp; title: string }> = [
            { match: /^\/app\/dashboard$/, title: 'Dashboard' },
            { match: /^\/app\/courses$/, title: 'Courses' },
            { match: /^\/app\/course\/[^/]+$/, title: 'Course Details' },
            { match: /^\/app\/lesson\/[^/]+$/, title: 'Lesson' },
            { match: /^\/app\/problems$/, title: 'Coding Problems' },
            { match: /^\/app\/problem\/[^/]+$/, title: 'Problem Solver' },
            { match: /^\/app\/battle$/, title: 'Battle Arena' },
            { match: /^\/app\/battle\/[^/]+$/, title: 'Battle Room' },
            { match: /^\/app\/about$/, title: 'About' },
            { match: /^\/app\/achievements$/, title: 'Achievements' },
            { match: /^\/app\/quizzes$/, title: 'Quizzes' },
            { match: /^\/app\/quiz\/[^/]+$/, title: 'Quiz Attempt' },
            { match: /^\/app\/profile$/, title: 'Profile' },
            { match: /^\/app\/submissions$/, title: 'Submissions' },
        ];

        const matched = routeMap.find((route) => route.match.test(location.pathname));
        return matched?.title || 'Workspace';
    }, [location.pathname]);

    const useHorizontalNav = false;
    const isImmersiveWorkspaceRoute =
        /^\/app\/problem\/[^/]+$/.test(location.pathname) ||
        /^\/app\/battle\/[^/]+$/.test(location.pathname);
    const isWideLayoutRoute = true;

    return (
        <div
            className="flex h-screen bg-background text-foreground overflow-hidden"
            style={{ height: 'calc(100vh / var(--app-zoom, 1))' }}
        >
            {!useHorizontalNav && (
                <Sidebar
                    collapsed={collapsed}
                    sections={sidebarSections}
                    isActive={isActive}
                    onNavigate={(path) => {
                        preloadRoute(path);
                        navigate(path);
                    }}
                    onLogout={() => {
                        logout();
                        navigate('/login');
                    }}
                    user={user || null}
                    streakDays={studentDashboard?.streakDays}
                />
            )}

            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <Navbar
                    title={pageTitle}
                    showTitle={!useHorizontalNav}
                    collapsed={collapsed}
                    showSidebarToggle={!useHorizontalNav}
                    showBrand={useHorizontalNav}
                    showTopNavStrip={useHorizontalNav}
                    onToggleSidebar={() => setCollapsed((prev) => !prev)}
                    onLogout={() => {
                        logout();
                        navigate('/login');
                    }}
                    user={user || null}
                    navItems={topNavItems}
                    isActive={isActive}
                    onNavigate={(path) => {
                        preloadRoute(path);
                        navigate(path);
                    }}
                />

                <ContentWrapper fullWidth={isWideLayoutRoute}>
                    <div className={`relative overflow-hidden ${isImmersiveWorkspaceRoute ? 'rounded-xl' : 'rounded-2xl'}`}>
                        <RouteTransitionLayer routeKey={location.pathname} />
                        <motion.div
                            key={location.pathname}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={pageTransition}
                            className="relative z-10 h-full min-w-0"
                        >
                            <Outlet />
                        </motion.div>
                    </div>
                </ContentWrapper>
            </div>
        </div>
    );
};

export default AppLayout;
