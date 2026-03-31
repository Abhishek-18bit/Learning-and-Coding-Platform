import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles, User2, UserPlus } from "lucide-react";
import { fadeIn, staggerContainer } from "../animations/variants";
import api from "../services/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import AuthExperiencePanel from "../components/auth/AuthExperiencePanel";

const RegisterPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "STUDENT" as "STUDENT" | "TEACHER",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const roleParam = searchParams.get('role');
        if (roleParam === 'TEACHER' || roleParam === 'STUDENT') {
            setFormData((prev) => ({ ...prev, role: roleParam }));
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (role: "STUDENT" | "TEACHER") => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await api.post("/auth/register", formData);
            navigate("/login");
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            setError(message || "Registration failed. Please try again.");
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
                <AuthExperiencePanel mode="register" />

                <motion.section variants={fadeIn}>
                    <Card variant="layered" tilt={false} className="auth-form-panel relative overflow-hidden p-0">
                        <div className="auth-form-header-bar" />
                        <div className="auth-form-noise" />

                        <div className="p-8 sm:p-10">
                            <div className="mb-8 text-center">
                                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border/70 bg-surface/80 text-primary-cyan shadow-soft">
                                    <Sparkles size={20} />
                                </div>
                                <h2 className="typ-h2 mb-1 !text-[2rem]">Create Account</h2>
                                <p className="typ-muted">Join and start your personalized learning path.</p>
                            </div>

                            {error && (
                                <div className="notification-slide-in mb-5 rounded-xl border border-error/35 bg-error/15 px-4 py-3 text-sm font-medium text-error">
                                    {error}
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="label-base mb-1.5 block">Full Name</label>
                                        <div className="relative">
                                            <User2
                                                size={16}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                            />
                                            <input
                                                name="name"
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="input-base bg-surface/80 pl-10"
                                                placeholder="John Doe"
                                                autoComplete="name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label-base mb-1.5 block">Email Address</label>
                                        <div className="relative">
                                            <Mail
                                                size={16}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                            />
                                            <input
                                                name="email"
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="input-base bg-surface/80 pl-10"
                                                placeholder="you@example.com"
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
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="input-base bg-surface/80 pl-10 pr-11"
                                                placeholder="********"
                                                autoComplete="new-password"
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

                                    <div>
                                        <label className="label-base mb-1.5 block">I am a...</label>
                                        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface/70 p-1">
                                            <button
                                                type="button"
                                                onClick={() => handleRoleChange("STUDENT")}
                                                className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                                                    formData.role === "STUDENT"
                                                        ? "border-primary-blue/60 bg-gradient-to-r from-primary-cyan/20 via-primary-blue/30 to-success/20 text-gray-900 shadow-soft"
                                                        : "border-transparent bg-surface text-muted hover:border-border hover:text-gray-700"
                                                }`}
                                            >
                                                Student
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRoleChange("TEACHER")}
                                                className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                                                    formData.role === "TEACHER"
                                                        ? "border-primary-blue/60 bg-gradient-to-r from-primary-cyan/20 via-primary-blue/30 to-success/20 text-gray-900 shadow-soft"
                                                        : "border-transparent bg-surface text-muted hover:border-border hover:text-gray-700"
                                                }`}
                                            >
                                                Teacher
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    fullWidth
                                    size="lg"
                                    className="auth-primary-action"
                                >
                                    {loading ? "Creating Account..." : "Create Account"}
                                    {!loading ? <ArrowRight size={16} /> : <UserPlus size={16} />}
                                </Button>
                            </form>

                            <p className="mt-6 text-center typ-muted">
                                Already have an account?{" "}
                                <Link
                                    to="/login"
                                    className="font-semibold text-primary-cyan transition-colors hover:text-primary-blue"
                                >
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </Card>
                </motion.section>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
