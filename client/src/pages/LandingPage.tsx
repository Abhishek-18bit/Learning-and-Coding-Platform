import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Rocket, Sparkles } from 'lucide-react';
import Card from '../components/ui/Card';
import { fadeIn, staggerContainer } from '../animations/variants';

const LandingPage = () => {
    return (
        <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-[-10rem] top-[-6rem] h-[28rem] w-[28rem] rounded-full bg-primary-cyan/7 blur-3xl" />
                <div className="absolute right-[-12rem] top-16 h-[30rem] w-[30rem] rounded-full bg-primary-blue/8 blur-3xl" />
                <div className="absolute bottom-[-15rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-primary-blue/6 blur-3xl" />
            </div>

            <motion.section
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="mx-auto mt-8 w-full max-w-[120rem] px-4 pb-16 md:px-6"
            >
                <motion.div variants={fadeIn} className="mission-shell p-6 md:p-8">
                    <div className="mission-shell-content space-y-7">
                        <div className="space-y-3 text-center">
                            <span className="mission-kicker">
                                <Sparkles size={12} />
                                Welcome to LEARNme
                            </span>
                            <h1 className="mission-title">
                                One Platform for
                                <span className="text-gradient"> Learning, Coding, and Competing</span>
                            </h1>
                            <p className="mission-subtitle mx-auto">
                                Start with a clean entry point, then jump into the full interactive intro to explore the
                                complete feature ecosystem.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Card variant="glass" className="p-5 text-center">
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-primary-blue/35 bg-primary-blue/15 text-primary-cyan">
                                    <Compass size={19} />
                                </div>
                                <h3 className="typ-h3 !mb-1 mt-3 !text-xl">Explore Intro</h3>
                                <p className="typ-muted mb-4">See the animated mission-control showcase of all platform features.</p>
                                <Link to="/intro" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-cyan">
                                    Open Intro
                                    <ArrowRight size={15} />
                                </Link>
                            </Card>

                            <Card variant="glass" className="p-5 text-center">
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-primary-blue/35 bg-primary-blue/15 text-primary-cyan">
                                    <Rocket size={19} />
                                </div>
                                <h3 className="typ-h3 !mb-1 mt-3 !text-xl">Create Account</h3>
                                <p className="typ-muted mb-4">Join as teacher or student and unlock your complete workspace.</p>
                                <Link to="/register" className="btn-gradient px-4 py-2.5 text-sm">
                                    Get Started
                                </Link>
                            </Card>

                            <Card variant="glass" className="p-5 text-center">
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-primary-blue/35 bg-primary-blue/15 text-primary-cyan">
                                    <ArrowRight size={19} />
                                </div>
                                <h3 className="typ-h3 !mb-1 mt-3 !text-xl">Continue Mission</h3>
                                <p className="typ-muted mb-4">Sign in and resume courses, quizzes, coding, or battle rounds.</p>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all dur-normal hover:border-primary-blue/60 hover:bg-surface"
                                >
                                    Sign In
                                    <ArrowRight size={15} />
                                </Link>
                            </Card>
                        </div>
                    </div>
                </motion.div>
            </motion.section>
        </div>
    );
};

export default LandingPage;
