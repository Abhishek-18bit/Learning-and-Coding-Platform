import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ClipboardCheck, Code2, LayoutDashboard, PenTool, Swords, UserCircle, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { pageTransition } from '../../animations/variants';
import ContentWrapper from './ContentWrapper';
import Sidebar, { type SidebarItem } from './Sidebar';
import Navbar from './Navbar';
import { preloadRoute } from '../../utils/routePreload';
import RouteTransitionLayer from './RouteTransitionLayer';

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
        if (!user) {
            return;
        }

        const likelyNextPaths = (user.role === 'TEACHER' || user.role === 'ADMIN')
            ? ['/app/dashboard', '/app/courses', '/app/problems', '/app/quizzes/manage', '/app/battle']
            : ['/app/dashboard', '/app/courses', '/app/problems', '/app/quizzes', '/app/battle'];

        const timeoutId = window.setTimeout(() => {
            likelyNextPaths.forEach((path) => preloadRoute(path));
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [user?.role]);

    const studentItems: SidebarItem[] = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/app/dashboard' },
        { icon: <BookOpen size={20} />, label: 'Courses', path: '/app/courses' },
        { icon: <Code2 size={20} />, label: 'Problems', path: '/app/problems' },
        { icon: <Swords size={20} />, label: 'Battle Arena', path: '/app/battle' },
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

    const menuItems = user?.role === 'TEACHER' || user?.role === 'ADMIN' ? teacherItems : studentItems;
    const bottomItems: SidebarItem[] = [{ icon: <UserCircle size={20} />, label: 'Profile', path: '/app/profile' }];

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
            { match: /^\/app\/quizzes$/, title: 'Quizzes' },
            { match: /^\/app\/quiz\/[^/]+$/, title: 'Quiz Attempt' },
            { match: /^\/app\/profile$/, title: 'Profile' },
            { match: /^\/app\/submissions$/, title: 'Submissions' },
        ];

        const matched = routeMap.find((route) => route.match.test(location.pathname));
        return matched?.title || 'Workspace';
    }, [location.pathname]);

    return (
        <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
            <Sidebar
                collapsed={collapsed}
                items={menuItems}
                bottomItems={bottomItems}
                isActive={isActive}
                onNavigate={(path) => {
                    preloadRoute(path);
                    navigate(path);
                }}
                onLogout={() => {
                    logout();
                    navigate('/login');
                }}
            />

            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                <Navbar
                    title={pageTitle}
                    collapsed={collapsed}
                    onToggleSidebar={() => setCollapsed((prev) => !prev)}
                    user={user || null}
                />

                <ContentWrapper>
                    <div className="relative overflow-hidden rounded-2xl">
                        <RouteTransitionLayer routeKey={location.pathname} />
                        <motion.div
                            key={location.pathname}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={pageTransition}
                            className="h-full min-w-0"
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
