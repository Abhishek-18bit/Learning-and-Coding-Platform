import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransition } from '../animations/variants';
import RouteTransitionLayer from '../components/layout/RouteTransitionLayer';

const PublicLayout = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen flex flex-col bg-background-soft">
            {/* Navbar Placeholder */}
            <nav className="sticky top-0 z-50 glass-effect border-b border-gray-100">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primary-light rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-medium">

                        </div>
                        <span className="font-headlines text-2xl font-bold tracking-tight text-gray-900">
                            LEARN<span className="text-primary">me</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 font-medium">
                        <a href="#" className="hover:text-primary transition-colors">Courses</a>
                        <a href="#" className="hover:text-primary transition-colors">Practice</a>
                        <a href="#" className="hover:text-primary transition-colors">Quiz</a>
                        <button className="btn-gradient">Get Started</button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow">
                <div className="relative overflow-hidden">
                    <RouteTransitionLayer routeKey={location.pathname} />
                    <motion.div
                        key={location.pathname}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pageTransition}
                    >
                        <Outlet />
                    </motion.div>
                </div>
            </main>

            {/* Footer Placeholder */}
            <footer className="bg-white border-t border-gray-100 py-12">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-secondary">© 2026 LEARNme. Designed for excellence.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
