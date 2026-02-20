import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { fadeIn, staggerContainer } from "../animations/variants";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", { email, password });
            login(response.data.token, response.data.user);
            navigate("/app/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-10rem)] px-4 py-10 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-16 top-8 h-72 w-72 rounded-full bg-primary-cyan/15 blur-3xl" />
                <div className="absolute right-[-8rem] top-1/3 h-80 w-80 rounded-full bg-primary-violet/15 blur-3xl" />
                <div className="absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-primary-blue/10 blur-3xl" />
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2"
            >
                <motion.section variants={fadeIn} className="hidden lg:block">
                    <Card variant="glass" className="h-full space-y-8">
                        <div className="space-y-4">
                            <Badge variant="primary">Learning Control Center</Badge>
                            <h1 className="typ-h1 !text-5xl mb-0">
                                Continue your momentum with smarter coding practice.
                            </h1>
                            <p className="typ-body">
                                Access quizzes, coding challenges, and course progress from one personalized workspace.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                "Adaptive quiz generation for lessons and PDFs",
                                "Track submissions, attempts, and progress by course",
                                "Teacher and student flows in one platform",
                            ].map((item) => (
                                <div key={item} className="rounded-xl border border-border bg-surface/70 p-4">
                                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <ShieldCheck size={16} className="text-success" />
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.section>

                <motion.section variants={fadeIn}>
                    <Card variant="layered" className="relative overflow-hidden p-0">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-cyan via-primary-blue to-primary-violet" />

                        <div className="p-8 sm:p-10">
                            <div className="mb-8 text-center">
                                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-blue/15 text-primary-cyan">
                                    <Sparkles size={20} />
                                </div>
                                <h2 className="typ-h2 !text-3xl mb-1">Welcome Back</h2>
                                <p className="typ-muted">Sign in to continue your learning path.</p>
                            </div>

                            {error && (
                                <div className="notification-slide-in mb-5 rounded-xl border border-error/35 bg-error/15 px-4 py-3 text-sm font-medium text-error">
                                    {error}
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="label-base mb-1.5 block">Email Address</label>
                                        <div className="relative">
                                            <Mail
                                                size={16}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                            />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="input-base pl-10"
                                                placeholder="you@example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label-base mb-1.5 block">Password</label>
                                        <div className="relative">
                                            <Lock
                                                size={16}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                            />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="input-base pl-10 pr-11"
                                                placeholder="********"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-2 text-muted hover:text-gray-700"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <label className="inline-flex items-center gap-2 text-muted">
                                        <input type="checkbox" className="h-4 w-4 rounded border-border bg-surface" />
                                        Remember me
                                    </label>
                                    <button type="button" className="font-semibold text-primary-cyan hover:text-primary-blue">
                                        Forgot password?
                                    </button>
                                </div>

                                <Button type="submit" disabled={loading} fullWidth size="lg">
                                    {loading ? "Signing In..." : "Sign In"}
                                    {!loading && <ArrowRight size={16} />}
                                </Button>
                            </form>

                            <p className="mt-6 text-center typ-muted">
                                Do not have an account?{" "}
                                <Link to="/register" className="font-semibold text-primary-cyan hover:text-primary-blue">
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </Card>
                </motion.section>
            </motion.div>
        </div>
    );
};

export default LoginPage;
