import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { fadeIn, staggerContainer } from "../animations/variants";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { preloadRoute } from "../utils/routePreload";

const INTRO_NAME = "Abhishek Kumar";
const INTRO_TAGLINE = "Engineered by";
const AUTO_REDIRECT_SECONDS = 4;
const PROFILE_IMAGE_SRC = "/intro-profile.png";
const AUTO_REDIRECT_STORAGE_KEY = "intro_auto_redirect_disabled";
const TAGLINE_TYPING_DELAY_MS = 85;

const IntroPage = () => {
    const navigate = useNavigate();
    const [autoRedirectEnabled, setAutoRedirectEnabled] = useState(() => {
        if (typeof window === "undefined") return true;
        return window.localStorage.getItem(AUTO_REDIRECT_STORAGE_KEY) !== "1";
    });
    const [typedTagline, setTypedTagline] = useState("");
    const [isTaglineTypingDone, setIsTaglineTypingDone] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(AUTO_REDIRECT_SECONDS);
    const [imageLoadFailed, setImageLoadFailed] = useState(false);

    useEffect(() => {
        let index = 0;
        setTypedTagline("");
        setIsTaglineTypingDone(false);

        const timer = window.setInterval(() => {
            index += 1;
            setTypedTagline(INTRO_TAGLINE.slice(0, index));
            if (index >= INTRO_TAGLINE.length) {
                window.clearInterval(timer);
                setIsTaglineTypingDone(true);
            }
        }, TAGLINE_TYPING_DELAY_MS);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!autoRedirectEnabled) return;
        if (remainingSeconds <= 0) {
            navigate("/login", { replace: true });
            return;
        }

        const countdownTimer = window.setTimeout(() => {
            setRemainingSeconds((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => window.clearTimeout(countdownTimer);
    }, [autoRedirectEnabled, navigate, remainingSeconds]);

    const handleToggleAutoRedirect = () => {
        const next = !autoRedirectEnabled;
        setAutoRedirectEnabled(next);
        if (next) {
            setRemainingSeconds(AUTO_REDIRECT_SECONDS);
            window.localStorage.removeItem(AUTO_REDIRECT_STORAGE_KEY);
        } else {
            window.localStorage.setItem(AUTO_REDIRECT_STORAGE_KEY, "1");
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-10rem)] overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-24 top-6 h-80 w-80 rounded-full bg-primary-cyan/20 blur-3xl" />
                <div className="absolute right-[-8rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-primary-violet/20 blur-3xl" />
                <div className="absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-primary-blue/15 blur-3xl" />
            </div>

            <div className="mx-auto mb-4 flex max-w-7xl items-center justify-end">
                <Button
                    variant="ghost"
                    size="sm"
                    onMouseEnter={() => preloadRoute("/login")}
                    onFocus={() => preloadRoute("/login")}
                    onClick={() => navigate("/login", { replace: true })}
                >
                    Skip Intro <ArrowRight size={14} />
                </Button>
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]"
            >
                <motion.section variants={fadeIn}>
                    <Card variant="glass" className="h-full space-y-8">
                        <div className="space-y-5">
                            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-cyan">
                                <Sparkles size={14} />
                                Welcome
                            </p>

                            <h1 className="typ-h1 !mb-0 !text-5xl xl:!text-6xl">
                                <span className={`intro-typewriter-text ${isTaglineTypingDone ? "intro-typewriter-glow" : ""}`}>
                                    {typedTagline}
                                </span>
                                <span
                                    className={`intro-typewriter-cursor ${
                                        isTaglineTypingDone ? "intro-typewriter-cursor-done" : ""
                                    }`}
                                    aria-hidden="true"
                                >
                                    |
                                </span>
                            </h1>
                            <motion.h2
                                initial={{ opacity: 0, y: 10, clipPath: "inset(0 100% 0 0)" }}
                                animate={{ opacity: 1, y: 0, clipPath: "inset(0 0% 0 0)" }}
                                transition={{ duration: 0.55, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                className="intro-name-cinematic -mt-2 inline-block text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl"
                            >
                                {INTRO_NAME}
                            </motion.h2>
                            <div className="-mt-2 w-full max-w-[22rem] sm:max-w-[26rem]">
                                <motion.div
                                    initial={{ scaleX: 0, opacity: 0 }}
                                    animate={{ scaleX: 1, opacity: 1 }}
                                    transition={{ duration: 0.45, delay: 0.5, ease: "easeInOut" }}
                                    className="intro-name-underline origin-left"
                                />
                            </div>

                            <p className="typ-body max-w-2xl">
                                A premium E-learning coding platform for quizzes, coding challenges, and AI-powered
                                learning workflows. Built to feel fast, modern, and serious.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-border bg-surface/70 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted">Quizzes</p>
                                <p className="mt-1 text-sm font-semibold text-gray-700">Manual + AI from lesson/PDF</p>
                            </div>
                            <div className="rounded-xl border border-border bg-surface/70 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted">Coding Arena</p>
                                <p className="mt-1 text-sm font-semibold text-gray-700">LeetCode-style submissions</p>
                            </div>
                            <div className="rounded-xl border border-border bg-surface/70 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted">Tracking</p>
                                <p className="mt-1 text-sm font-semibold text-gray-700">Progress + attempt analytics</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                to="/login"
                                onMouseEnter={() => preloadRoute("/login")}
                                onFocus={() => preloadRoute("/login")}
                            >
                                <Button size="lg">
                                    Enter Platform <ArrowRight size={16} />
                                </Button>
                            </Link>
                            <Link
                                to="/landing"
                                onMouseEnter={() => preloadRoute("/landing")}
                                onFocus={() => preloadRoute("/landing")}
                            >
                                <Button variant="secondary" size="lg">
                                    Explore Features
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                                    Auto Enter
                                </p>
                                <button
                                    type="button"
                                    onClick={handleToggleAutoRedirect}
                                    className={`relative h-7 w-14 rounded-full border transition-all ${
                                        autoRedirectEnabled
                                            ? "border-primary-blue/60 bg-primary-blue/20"
                                            : "border-border bg-surface"
                                    }`}
                                    aria-label="Toggle auto redirect"
                                >
                                    <span
                                        className={`absolute top-1 h-5 w-5 rounded-full bg-gray-900 transition-all ${
                                            autoRedirectEnabled ? "left-8" : "left-1"
                                        }`}
                                    />
                                </button>
                            </div>
                            {autoRedirectEnabled ? (
                                <>
                                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
                                        <span>Redirecting</span>
                                        <span>{remainingSeconds}s</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full border border-border bg-surface">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-primary-cyan via-primary-blue to-primary-violet"
                                            initial={false}
                                            animate={{
                                                width: `${Math.max(
                                                    0,
                                                    (remainingSeconds / AUTO_REDIRECT_SECONDS) * 100
                                                )}%`,
                                            }}
                                            transition={{ duration: 0.22, ease: "easeInOut" }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                                    Auto-redirect disabled. Stay on intro until you click.
                                </p>
                            )}
                        </div>
                    </Card>
                </motion.section>

                <motion.section variants={fadeIn}>
                    <Card variant="layered" className="relative h-full overflow-hidden p-0">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.25),transparent_45%)]" />

                        <div className="relative h-full min-h-[28rem] p-5">
                            <div className="absolute inset-x-0 top-0 h-[72%] bg-gradient-to-b from-primary-blue/15 via-surface to-surface-elevated" />

                            <div className="relative z-10 mx-auto mt-2 w-full max-w-md">
                                <div className="relative mx-auto w-full max-w-[23rem]">
                                    <motion.div
                                        className="absolute inset-[-12px] rounded-[2.2rem] bg-gradient-to-br from-primary-cyan/30 via-primary-blue/20 to-primary-violet/30 blur-xl"
                                        animate={{ opacity: [0.6, 1, 0.6] }}
                                        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                                    />

                                    <motion.div
                                        className="absolute inset-[-2px] rounded-[2rem] border border-primary-cyan/45"
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                                    />

                                    <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface-elevated shadow-strong">
                                        {!imageLoadFailed ? (
                                            <motion.img
                                                src={PROFILE_IMAGE_SRC}
                                                alt={`${INTRO_NAME} portrait`}
                                                className="h-[24rem] w-full object-cover object-[center_18%] sm:h-[26rem] lg:h-[28rem]"
                                                loading="eager"
                                                initial={{ scale: 1.04 }}
                                                animate={{ scale: 1.08 }}
                                                transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                                                onError={() => setImageLoadFailed(true)}
                                            />
                                        ) : (
                                            <div className="flex h-[24rem] w-full items-center justify-center bg-gradient-to-br from-primary-blue/30 via-surface to-primary-violet/25 sm:h-[26rem] lg:h-[28rem]">
                                                <span className="text-6xl font-extrabold text-gray-900">
                                                    {INTRO_NAME
                                                        .split(" ")
                                                        .map((part) => part[0])
                                                        .slice(0, 2)
                                                        .join("")}
                                                </span>
                                            </div>
                                        )}

                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card via-card/60 to-transparent p-5">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-cyan">
                                                Creator
                                            </p>
                                            <p className="mt-1 text-xl font-bold text-gray-900">{INTRO_NAME}</p>
                                            <p className="text-sm font-medium text-muted">AI + Coding Education Platform</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="intro-skyline absolute bottom-32 left-0 h-36 w-[200%] opacity-70" />
                            <div className="absolute bottom-24 left-0 h-24 w-full bg-surface-elevated" />
                            <div className="absolute bottom-24 left-0 h-1 w-full bg-primary-blue/30" />
                            <div className="intro-road-dash absolute bottom-[7.25rem] left-0 h-1 w-full" />

                            <motion.div
                                className="absolute bottom-24 left-[-9rem]"
                                animate={{ x: ["0%", "160%"] }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            >
                                <div className="intro-car-float relative h-20 w-44">
                                    <div className="absolute bottom-5 left-0 h-10 w-full rounded-2xl border border-border bg-gradient-to-r from-primary-cyan/70 via-primary-blue/70 to-primary-violet/70 shadow-medium" />
                                    <div className="absolute bottom-12 left-8 h-7 w-20 rounded-t-2xl border border-border bg-surface-elevated/90" />
                                    <div className="absolute bottom-14 left-11 h-4 w-8 rounded bg-card/80" />
                                    <div className="absolute bottom-14 left-[4.1rem] h-4 w-8 rounded bg-card/80" />
                                    <div className="absolute bottom-7 right-[-0.25rem] h-2.5 w-4 rounded-r bg-warning/80" />

                                    <div className="intro-wheel absolute bottom-0 left-6 h-8 w-8 rounded-full border-4 border-gray-800 bg-gray-500" />
                                    <div className="intro-wheel absolute bottom-0 right-6 h-8 w-8 rounded-full border-4 border-gray-800 bg-gray-500" />
                                </div>
                            </motion.div>

                            <div className="absolute inset-x-0 bottom-0 p-5">
                                <div className="rounded-xl border border-border bg-card/70 px-4 py-3 backdrop-blur">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-cyan">
                                        Live Intro Scene
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-700">
                                        Your portrait + live motion layer tuned to your platform identity.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.section>
            </motion.div>
        </div>
    );
};

export default IntroPage;
