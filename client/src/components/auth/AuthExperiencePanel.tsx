import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Brain, Code2, Flame, Radar, Rocket, ShieldCheck, Sparkles, Trophy, Zap } from "lucide-react";
import { fadeIn } from "../../animations/variants";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

type AuthMode = "login" | "register";

interface AuthExperiencePanelProps {
    mode: AuthMode;
}

interface ShowcaseStat {
    label: string;
    value: string;
    icon: LucideIcon;
}

interface ShowcaseProgress {
    label: string;
    value: string;
    widthClass: string;
}

interface ShowcaseContent {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    consoleTitle: string;
    floatingTop: string;
    floatingBottom: string;
    stats: ShowcaseStat[];
    progress: ShowcaseProgress[];
}

const showcaseContent: Record<AuthMode, ShowcaseContent> = {
    login: {
        badge: "Gamified Learning Access",
        title: "Return to your",
        titleHighlight: "mission control",
        description:
            "Continue coding challenges, real-time battles, and AI-guided lessons from one interactive workspace.",
        consoleTitle: "Live Learning Feed",
        floatingTop: "142 learners online",
        floatingBottom: "Rank updates every attempt",
        stats: [
            { label: "Daily streak", value: "18 days", icon: Flame },
            { label: "Current rank", value: "#124", icon: Trophy },
            { label: "Battle ready", value: "Live", icon: Radar },
        ],
        progress: [
            { label: "Quizzes", value: "72%", widthClass: "w-[72%]" },
            { label: "Coding", value: "65%", widthClass: "w-[65%]" },
            { label: "Interview prep", value: "48%", widthClass: "w-[48%]" },
        ],
    },
    register: {
        badge: "Create Your Mission Profile",
        title: "Launch your",
        titleHighlight: "learning account",
        description:
            "Join as a student or teacher, unlock AI-powered paths, and track every milestone from day one.",
        consoleTitle: "Starter Mission State",
        floatingTop: "Team-friendly classrooms",
        floatingBottom: "AI mentor always active",
        stats: [
            { label: "Skill tracks", value: "12 paths", icon: Rocket },
            { label: "AI support", value: "24/7", icon: Sparkles },
            { label: "Secure access", value: "Verified", icon: ShieldCheck },
        ],
        progress: [
            { label: "Onboarding", value: "90%", widthClass: "w-[90%]" },
            { label: "Setup wizard", value: "78%", widthClass: "w-[78%]" },
            { label: "Starter tasks", value: "54%", widthClass: "w-[54%]" },
        ],
    },
};

const AuthExperiencePanel = ({ mode }: AuthExperiencePanelProps) => {
    const content = showcaseContent[mode];

    return (
        <motion.section variants={fadeIn} className="relative hidden lg:block">
            <Card variant="glass" tilt={false} className="auth-hero-panel h-full p-8">
                <div className="auth-hero-grid" />
                <div className="auth-hero-aurora" />

                <div className="mission-shell-content space-y-8">
                    <div className="space-y-4">
                        <Badge variant="primary">{content.badge}</Badge>
                        <h1 className="typ-h1 mb-0 text-[2.8rem] leading-tight">
                            {content.title} <span className="auth-title-gradient">{content.titleHighlight}</span>
                        </h1>
                        <p className="typ-body max-w-2xl">{content.description}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {content.stats.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="auth-stat-card">
                                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-surface/80 text-primary-cyan">
                                        <Icon size={16} />
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{stat.label}</p>
                                    <p className="mt-1 text-base font-bold text-gray-900">{stat.value}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="auth-progress-panel">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Mission Progress</p>
                            <p className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
                                <span className="auth-live-dot" />
                                Live
                            </p>
                        </div>
                        <div className="space-y-3">
                            {content.progress.map((item) => (
                                <div key={item.label}>
                                    <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted">
                                        <span>{item.label}</span>
                                        <span className="font-semibold text-gray-700">{item.value}</span>
                                    </div>
                                    <div className="auth-progress-track">
                                        <span className={`auth-progress-fill ${item.widthClass}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="auth-live-console">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{content.consoleTitle}</p>
                            <p className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
                                <span className="auth-live-dot" />
                                Synced
                            </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                            <div className="auth-console-card">
                                <Code2 size={14} className="text-primary-cyan" />
                                <span>Code Arena</span>
                            </div>
                            <div className="auth-console-card">
                                <Brain size={14} className="text-primary-blue" />
                                <span>AI Mentor</span>
                            </div>
                            <div className="auth-console-card">
                                <Trophy size={14} className="text-success" />
                                <span>Battle Rank</span>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="auth-console-row">
                                <span>Quiz accuracy</span>
                                <span>84%</span>
                            </div>
                            <div className="auth-console-row">
                                <span>Problems solved</span>
                                <span>126</span>
                            </div>
                            <div className="auth-console-row">
                                <span>Battle readiness</span>
                                <span>High</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="auth-floating-chip auth-floating-chip-top">
                    <Zap size={14} className="text-primary-cyan" />
                    <span>{content.floatingTop}</span>
                </div>
                <div className="auth-floating-chip auth-floating-chip-bottom">
                    <Trophy size={14} className="text-success" />
                    <span>{content.floatingBottom}</span>
                </div>
            </Card>
        </motion.section>
    );
};

export default AuthExperiencePanel;
