import { motion } from 'framer-motion';
import {
    ArrowUpRight,
    BriefcaseBusiness,
    Code2,
    Github,
    Globe,
    Linkedin,
    Mail,
    Sparkles,
    Trophy,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { fadeIn, staggerContainer } from '../animations/variants';

const ABOUT_PROFILE = {
    name: 'Abhishek Kumar',
    title: 'Backend + AI Systems Engineer',
    summary:
        'I build production-grade learning systems that combine coding practice, battle rooms, quizzes, and AI-assisted workflows.',
    email: 'abhishek@example.com',
    location: 'India',
    photoUrl: '/intro-profile.png',
    resumeUrl: '/abhishek_resume.pdf',
    portfolioUrl: '#',
};

const PLATFORM_LINKS = [
    {
        label: 'LeetCode',
        username: '@Abhishek_126',
        href: 'https://leetcode.com/u/Abhishek_126/',
        icon: Code2,
        accent: 'from-warning/25 via-warning/10 to-card',
    },
    {
        label: 'LinkedIn',
        username: 'abhishek-kumar-3330b11b1',
        href: 'https://www.linkedin.com/in/abhishek-kumar-3330b11b1/',
        icon: Linkedin,
        accent: 'from-primary-blue/25 via-primary-cyan/10 to-card',
    },
    {
        label: 'Portfolio',
        username: 'your-portfolio.dev',
        href: '#',
        icon: Globe,
        accent: 'from-primary-blue/22 via-primary-cyan/8 to-card',
    },
    {
        label: 'GitHub',
        username: '@Abhishek-18bit',
        href: 'https://github.com/Abhishek-18bit',
        icon: Github,
        accent: 'from-success/20 via-primary-blue/10 to-card',
    },
];

const HIGHLIGHTS = [
    {
        label: 'Coding Platform',
        value: 'LeetCode-style Judge',
        icon: Code2,
    },
    {
        label: 'Realtime',
        value: 'Battle Rooms + Leaderboard',
        icon: Trophy,
    },
    {
        label: 'Product',
        value: 'E-learning SaaS Workflow',
        icon: BriefcaseBusiness,
    },
];

const openExternal = (url: string) => {
    if (!url || url === '#') {
        return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
};

const AboutPage = () => {
    return (
        <div className="relative min-h-[calc(100vh-11rem)] overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-28 top-8 h-80 w-80 rounded-full bg-primary-cyan/8 blur-3xl" />
                <div className="absolute right-[-9rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-primary-blue/9 blur-3xl" />
                <div className="absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-primary-blue/7 blur-3xl" />
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="mx-auto grid w-full max-w-[120rem] grid-cols-1 gap-6 px-1 pb-2 pt-2 xl:grid-cols-[1.1fr_0.9fr]"
            >
                <motion.section variants={fadeIn}>
                    <Card variant="layered" className="space-y-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-3">
                                <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-cyan">
                                    <Sparkles size={12} />
                                    About Me
                                </p>
                                <h1 className="typ-h1 !mb-0 !text-4xl md:!text-5xl">{ABOUT_PROFILE.name}</h1>
                                <p className="typ-h3 !mb-0 !text-xl md:!text-2xl !font-medium text-primary-cyan">
                                    {ABOUT_PROFILE.title}
                                </p>
                                <p className="typ-body max-w-3xl">{ABOUT_PROFILE.summary}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="success">Open To Work</Badge>
                                <Badge variant="muted">{ABOUT_PROFILE.location}</Badge>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                variant="primary"
                                onClick={() => openExternal(ABOUT_PROFILE.portfolioUrl)}
                            >
                                View Portfolio <ArrowUpRight size={15} />
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => openExternal(ABOUT_PROFILE.resumeUrl)}
                            >
                                Resume <ArrowUpRight size={15} />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => openExternal(`mailto:${ABOUT_PROFILE.email}`)}
                            >
                                <Mail size={15} />
                                Contact
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            {HIGHLIGHTS.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Card key={item.label} variant="glass" className="p-4 space-y-2">
                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary-blue/40 bg-primary-blue/20 text-primary-cyan">
                                            <Icon size={16} />
                                        </span>
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted">{item.label}</p>
                                        <p className="text-sm font-semibold text-gray-700">{item.value}</p>
                                    </Card>
                                );
                            })}
                        </div>
                    </Card>
                </motion.section>

                <motion.section variants={fadeIn}>
                    <Card variant="glass" className="h-full overflow-hidden p-0">
                        <div className="relative p-5">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_52%)]" />
                            <div className="relative z-10 mx-auto w-full max-w-[24rem]">
                                <div className="relative overflow-hidden rounded-[1.7rem] border border-border bg-surface-elevated shadow-strong">
                                    <img
                                        src={ABOUT_PROFILE.photoUrl}
                                        alt={`${ABOUT_PROFILE.name} portrait`}
                                        className="h-[24rem] w-full object-cover object-[center_16%]"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card via-card/60 to-transparent p-5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-cyan">
                                            Engineered By
                                        </p>
                                        <p className="mt-1 text-xl font-bold text-gray-900">{ABOUT_PROFILE.name}</p>
                                        <p className="text-sm font-medium text-muted">{ABOUT_PROFILE.title}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.section>
            </motion.div>

            <motion.section
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="mx-auto mt-6 w-full max-w-[120rem] px-1 pb-2"
            >
                <Card variant="layered" className="space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="typ-h2 !mb-1">Profiles</h2>
                            <p className="typ-muted">Connect across professional and coding platforms.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {PLATFORM_LINKS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => openExternal(item.href)}
                                    className="group text-left"
                                >
                                    <Card
                                        variant="glass"
                                        className={`relative h-full overflow-hidden bg-gradient-to-br ${item.accent} p-4 transition-all dur-normal hover:-translate-y-1 hover:shadow-medium`}
                                    >
                                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary-blue/40 bg-card/70 text-primary-cyan">
                                            <Icon size={18} />
                                        </div>

                                        <p className="text-xs font-bold uppercase tracking-wider text-muted">{item.label}</p>
                                        <p className="mt-1 text-base font-semibold text-gray-900">{item.username}</p>

                                        <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-cyan">
                                            Open Profile
                                            <ArrowUpRight
                                                size={14}
                                                className="transition-transform dur-fast group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                            />
                                        </div>
                                    </Card>
                                </button>
                            );
                        })}
                    </div>
                </Card>
            </motion.section>
        </div>
    );
};

export default AboutPage;


