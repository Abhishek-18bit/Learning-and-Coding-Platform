import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
    ArrowRight,
    BarChart3,
    BrainCircuit,
    ChartSpline,
    Code2,
    Flame,
    MessageSquareText,
    Radar,
    Sparkles,
    Swords,
    Users,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import AnimatedCounter from '../components/AnimatedCounter';
import { fadeIn, staggerContainer } from '../animations/variants';

type FeatureBlock = {
    title: string;
    description: string;
    icon: typeof BrainCircuit;
};

type SocialStat = {
    title: string;
    value: number;
    suffix: string;
    note: string;
};

const FEATURE_BLOCKS: FeatureBlock[] = [
    {
        title: 'AI Code Mentor',
        description: 'Context-aware coding guidance with explainable hints and adaptive feedback loops.',
        icon: BrainCircuit,
    },
    {
        title: 'Real-Time Competitive Battles',
        description: 'Live room coding duels with synchronized timers, rankings, and leaderboard updates.',
        icon: Swords,
    },
    {
        title: 'Smart Doubt Discussion System',
        description: 'Fast threaded discussions around lessons, quizzes, battles, and coding problems.',
        icon: MessageSquareText,
    },
    {
        title: 'Personalized Skill Analytics',
        description: 'Learning telemetry with strengths, weak zones, and actionable next-step recommendations.',
        icon: ChartSpline,
    },
];

const SOCIAL_STATS: SocialStat[] = [
    {
        title: 'Problems Solved',
        value: 10,
        suffix: 'K+',
        note: 'Across coding practice, quizzes, and battle rounds.',
    },
    {
        title: 'Active Learners',
        value: 5,
        suffix: 'K+',
        note: 'Daily platform participation from students and mentors.',
    },
    {
        title: 'Interview Success',
        value: 95,
        suffix: '%',
        note: 'Learners reporting improved interview outcomes.',
    },
    {
        title: 'AI Mentor Coverage',
        value: 24,
        suffix: '/7',
        note: 'Always-on support and guidance availability.',
    },
];

const AnimatedStatCard = ({ title, value, suffix, note }: SocialStat) => {
    const statRef = useRef<HTMLDivElement | null>(null);
    const inView = useInView(statRef, { once: true, amount: 0.4 });

    return (
        <motion.div ref={statRef} variants={fadeIn}>
            <Card variant="glass" hoverLift className="h-full border-border/80 bg-card/60 p-5 backdrop-blur-xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{title}</p>
                <p className="mt-2 text-3xl font-bold leading-tight text-gray-900">
                    {inView ? <AnimatedCounter from={0} to={value} duration={1.6} suffix={suffix} /> : `0${suffix}`}
                </p>
                <p className="mt-2 text-sm text-muted">{note}</p>
            </Card>
        </motion.div>
    );
};

const IntroPage = () => {
    return (
        <div className="relative overflow-hidden pb-20">
            <div className="pointer-events-none absolute inset-0 -z-20 intro-mesh-background" />
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <span className="intro-floating-particle intro-particle-1" />
                <span className="intro-floating-particle intro-particle-2" />
                <span className="intro-floating-particle intro-particle-3" />
                <span className="intro-floating-particle intro-particle-4" />
                <span className="intro-floating-particle intro-particle-5" />
                <span className="intro-floating-particle intro-particle-6" />
                <span className="intro-floating-particle intro-particle-7" />
            </div>

            <motion.section
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="mx-auto mt-6 max-w-[1400px] px-4 md:mt-8 md:px-6"
            >
                <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                    <motion.div variants={fadeIn} className="space-y-6">
                        <span className="inline-flex items-center gap-2 rounded-full border border-primary-cyan/35 bg-primary-cyan/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-cyan">
                            <Sparkles size={12} />
                            AI Learning Command Center
                        </span>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-6xl">
                                Learn. Code. Compete.
                                <br />
                                <span className="intro-gradient-text">Master.</span>
                            </h1>
                            <p className="max-w-2xl text-lg leading-8 text-muted">
                                A premium AI-powered ecosystem for coding practice, adaptive learning, live battles,
                                and continuous performance growth for both students and teachers.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link to="/register">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="!from-primary-cyan !via-primary-blue !to-success"
                                >
                                    Get Started
                                    <ArrowRight size={16} />
                                </Button>
                            </Link>

                            <a href="#features">
                                <Button variant="secondary" size="lg" className="border-border bg-surface-elevated">
                                    Explore Features
                                </Button>
                            </a>
                        </div>
                    </motion.div>

                    <motion.div variants={fadeIn} className="relative min-h-[380px] lg:min-h-[460px]">
                        <div
                            className="intro-hero-glow-panel relative h-full rounded-2xl border border-border/80 bg-card/55 p-4 shadow-strong backdrop-blur-2xl md:p-5"
                        >
                            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface/70 px-4 py-3">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Live Mission Feed</p>
                                <span className="inline-flex items-center gap-2 text-xs font-semibold text-success">
                                    <span className="intro-status-pulse" />
                                    Online
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <Card variant="glass" className="border-border/70 bg-surface/65 p-4" tilt={false}>
                                    <p className="text-xs font-semibold text-muted">Learner Progress</p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        <AnimatedCounter from={0} to={87} duration={1.8} suffix="%" />
                                    </p>
                                    <p className="mt-1 text-xs text-success">+12% this week</p>
                                </Card>

                                <Card variant="glass" className="border-border/70 bg-surface/65 p-4" tilt={false}>
                                    <p className="text-xs font-semibold text-muted">Battle Queue</p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        <AnimatedCounter from={0} to={42} duration={1.8} suffix=" Live" />
                                    </p>
                                    <p className="mt-1 text-xs text-primary-cyan">Realtime synced</p>
                                </Card>
                            </div>

                            <Card variant="glass" className="mt-3 border-border/70 bg-surface/65 p-4" tilt={false}>
                                <div className="flex items-center justify-between text-xs font-semibold text-muted">
                                    <span>AI Mentor Response</span>
                                    <span>128ms</span>
                                </div>
                                <div className="mt-3 h-2 rounded-full bg-surface-elevated">
                                    <motion.div
                                        className="h-2 rounded-full bg-gradient-to-r from-primary-cyan via-primary-blue to-success"
                                        initial={{ width: '20%' }}
                                        animate={{ width: ['24%', '68%', '54%', '86%'] }}
                                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                </div>
                            </Card>
                        </div>

                        <motion.div
                            className="absolute -left-4 top-8 rounded-xl border border-border/75 bg-surface/75 px-4 py-3 text-xs font-semibold text-gray-700 shadow-soft backdrop-blur-xl"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <span className="inline-flex items-center gap-2">
                                <Flame size={14} className="text-success" />
                                12-day coding streak
                            </span>
                        </motion.div>

                        <motion.div
                            className="absolute -right-3 bottom-10 rounded-xl border border-border/75 bg-surface/75 px-4 py-3 text-xs font-semibold text-gray-700 shadow-soft backdrop-blur-xl"
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                        >
                            <span className="inline-flex items-center gap-2">
                                <Users size={14} className="text-primary-cyan" />
                                128 learners active now
                            </span>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.section>

            <motion.section
                id="features"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
                className="mx-auto mt-8 max-w-[1400px] px-4 md:px-6"
            >
                <motion.div variants={fadeIn} className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-cyan">Feature Showcase</p>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                            Built for Modern AI Learning Workflows
                        </h2>
                        <p className="max-w-3xl text-sm leading-7 text-muted md:text-base">
                            Designed with clear system feedback, real-time collaboration, and high-signal learner analytics.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {FEATURE_BLOCKS.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.35 }}
                                    transition={{ duration: 0.26, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <Card
                                        variant="glass"
                                        hoverLift
                                        className="h-full border-border/80 bg-card/60 p-5 backdrop-blur-xl"
                                    >
                                        <motion.span
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary-blue/35 bg-primary-blue/18 text-primary-cyan"
                                            animate={{ y: [0, -3, 0] }}
                                            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 }}
                                        >
                                            <Icon size={20} />
                                        </motion.span>

                                        <h3 className="mt-4 text-xl font-bold text-gray-900">{feature.title}</h3>
                                        <p className="mt-2 text-sm leading-7 text-muted">{feature.description}</p>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </motion.section>

            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
                className="mx-auto mt-8 max-w-[1400px] px-4 md:px-6"
            >
                <motion.div variants={fadeIn} className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-cyan">Live Product Preview</p>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                            Realtime UI Signals That Feel Alive
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <Card variant="glass" className="border-border/80 bg-card/60 p-5 backdrop-blur-xl" hoverLift>
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Animated Leaderboard</p>
                                <span className="inline-flex items-center gap-2 text-xs font-semibold text-success">
                                    <span className="intro-status-pulse" />
                                    Updating
                                </span>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { rank: 1, user: 'Aarav', score: 1280, trend: '+42' },
                                    { rank: 2, user: 'Mira', score: 1195, trend: '+35' },
                                    { rank: 3, user: 'Ishan', score: 1132, trend: '+28' },
                                ].map((row, index) => (
                                    <motion.div
                                        key={row.rank}
                                        className="grid grid-cols-[2.1rem_1fr_auto_auto] items-center gap-3 rounded-lg border border-border/70 bg-surface/70 px-3 py-2"
                                        animate={{ y: [0, index === 0 ? -2 : 0, 0] }}
                                        transition={{ duration: 2.6, repeat: Infinity, delay: index * 0.25, ease: 'easeInOut' }}
                                    >
                                        <span className="text-sm font-bold text-primary-cyan">#{row.rank}</span>
                                        <span className="text-sm font-semibold text-gray-900">{row.user}</span>
                                        <span className="text-sm font-semibold text-gray-700">{row.score}</span>
                                        <span className="text-xs font-semibold text-success">{row.trend}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>

                        <Card variant="glass" className="border-border/80 bg-card/60 p-5 backdrop-blur-xl" hoverLift>
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Skill Radar</p>
                                <Radar size={16} className="text-primary-cyan" />
                            </div>
                            <div className="relative flex items-center justify-center py-2">
                                <motion.svg
                                    viewBox="0 0 220 220"
                                    className="h-52 w-52"
                                    animate={{ rotate: [0, 4, 0] }}
                                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <circle cx="110" cy="110" r="82" fill="none" stroke="rgba(51,65,85,0.9)" strokeWidth="1" />
                                    <circle cx="110" cy="110" r="58" fill="none" stroke="rgba(51,65,85,0.8)" strokeWidth="1" />
                                    <circle cx="110" cy="110" r="34" fill="none" stroke="rgba(51,65,85,0.8)" strokeWidth="1" />
                                    <polygon
                                        points="110,28 168,82 149,170 71,170 52,82"
                                        fill="rgba(168,85,247,0.08)"
                                        stroke="rgba(168,85,247,0.85)"
                                        strokeWidth="2"
                                    />
                                    <motion.path
                                        d="M30 154 C72 130, 108 144, 146 110 C165 92, 182 78, 194 62"
                                        fill="none"
                                        stroke="rgba(34,211,238,0.9)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        className="intro-chart-line"
                                    />
                                </motion.svg>
                            </div>
                        </Card>

                        <Card variant="glass" className="border-border/80 bg-card/60 p-5 backdrop-blur-xl" hoverLift>
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Code Editor Preview</p>
                                <Code2 size={16} className="text-primary-cyan" />
                            </div>
                            <div className="rounded-xl border border-border/70 bg-surface/70 p-3 font-code text-sm">
                                <p className="text-muted">// AI mentor suggestion</p>
                                <p className="text-gray-700">function solve(input) {'{'}</p>
                                <p className="pl-4 text-primary-cyan">const values = input.split(' ');</p>
                                <p className="pl-4 text-success">return values.reduce((a, b) =&gt; a + Number(b), 0);</p>
                                <p className="text-gray-700">{'}'}</p>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted">
                                <span className="inline-flex items-center gap-2">
                                    <span className="intro-status-pulse" />
                                    Runtime: 42ms
                                </span>
                                <span>Verdict: ACCEPTED</span>
                            </div>
                        </Card>

                        <Card variant="glass" className="border-border/80 bg-card/60 p-5 backdrop-blur-xl" hoverLift>
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Progress Analytics</p>
                                <BarChart3 size={16} className="text-primary-cyan" />
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Problem Solving', width: '82%' },
                                    { label: 'Quiz Accuracy', width: '74%' },
                                    { label: 'Battle Ranking', width: '67%' },
                                ].map((item, index) => (
                                    <div key={item.label}>
                                        <div className="mb-1 flex items-center justify-between text-xs text-muted">
                                            <span>{item.label}</span>
                                            <span>{item.width}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-surface-elevated">
                                            <motion.div
                                                className="h-2 rounded-full bg-gradient-to-r from-primary-cyan via-primary-blue to-success"
                                                initial={{ width: '0%' }}
                                                whileInView={{ width: item.width }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: index * 0.08, ease: 'easeInOut' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </motion.div>
            </motion.section>

            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={staggerContainer}
                className="mx-auto mt-8 max-w-[1400px] px-4 md:px-6"
            >
                <motion.div variants={fadeIn} className="space-y-5">
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-cyan">Social Proof</p>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                            Trusted by a Growing Learning Community
                        </h2>
                    </div>

                    <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {SOCIAL_STATS.map((stat) => (
                            <AnimatedStatCard key={stat.title} {...stat} />
                        ))}
                    </motion.div>
                </motion.div>
            </motion.section>

            <motion.section
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="mx-auto mt-10 max-w-[1200px] px-4 md:px-6"
            >
                <div className="rounded-2xl border border-border/80 bg-card/65 px-6 py-10 text-center shadow-strong backdrop-blur-2xl md:px-10">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-cyan">Final CTA</p>
                    <h2 className="mt-2 text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
                        <span className="intro-gradient-text">Build Smarter. Learn Faster.</span>
                    </h2>
                    <div className="intro-glow-underline mx-auto mt-4" />
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted">
                        Start your AI-powered coding and learning journey with modern workflows designed for real outcomes.
                    </p>
                    <div className="mt-7">
                        <Link to="/register">
                            <Button
                                variant="primary"
                                size="lg"
                                className="intro-cta-pulse !from-primary-cyan !via-primary-blue !to-success"
                            >
                                Get Started
                                <ArrowRight size={16} />
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.section>
        </div>
    );
};

export default IntroPage;


