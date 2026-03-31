import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { fadeIn, staggerContainer } from "../animations/variants";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import AuthExperiencePanel from "../components/auth/AuthExperiencePanel";

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
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            setError(message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-shell min-h-[calc(100vh-10rem)] px-4 py-8 sm:px-6 lg:px-8">
            <div className="auth-page-background pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="auth-mesh-layer" />
                <div className="auth-grid-layer" />
                <span className="auth-orb auth-orb-left" />
                <span className="auth-orb auth-orb-right" />
                <span className="auth-orb auth-orb-bottom" />
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]"
            >
                <AuthExperiencePanel mode="login" />

                <motion.section variants={fadeIn}>
                    <Card variant="layered" tilt={false} className="auth-form-panel relative overflow-hidden p-0">
                        <div className="auth-form-header-bar" />
                        <div className="auth-form-noise" />

                        <div className="p-8 sm:p-10">
                            <div className="mb-8 text-center">
                                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border/70 bg-surface/80 text-primary-cyan shadow-soft">
                                    <Sparkles size={20} />
                                </div>
                                <h2 className="typ-h2 mb-1 !text-[2rem]">Welcome Back</h2>
                                <p className="typ-muted">Sign in to continue your coding and learning mission.</p>
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
                                                className="input-base bg-surface/80 pl-10"
                                                placeholder="you@example.com"
                                                required
                                                autoComplete="email"
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
                                                className="input-base bg-surface/80 pl-10 pr-11"
                                                placeholder="********"
                                                required
                                                autoComplete="current-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface-elevated p-2 text-muted hover:text-gray-700"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <label className="inline-flex items-center gap-2 text-muted">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-border bg-surface text-primary-blue"
                                        />
                                        Remember me
                                    </label>
                                    <button
                                        type="button"
                                        className="font-semibold text-primary-cyan transition-colors hover:text-primary-blue"
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                <Button type="submit" disabled={loading} fullWidth size="lg" className="auth-primary-action">
                                    {loading ? "Signing In..." : "Sign In"}
                                    {!loading && <ArrowRight size={16} />}
                                </Button>
                            </form>

                            <p className="mt-6 text-center typ-muted">
                                Do not have an account?{" "}
                                <Link
                                    to="/register"
                                    className="font-semibold text-primary-cyan transition-colors hover:text-primary-blue"
                                >
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
