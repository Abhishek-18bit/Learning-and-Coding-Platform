import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles, User2, UserCheck, UserPlus } from "lucide-react";
import { fadeIn, staggerContainer } from "../animations/variants";
import api from "../services/api";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "STUDENT" as "STUDENT" | "TEACHER",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
        } catch (err: any) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
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
                            <Badge variant="primary">Get Started</Badge>
                            <h1 className="typ-h1 !text-5xl mb-0">Build your learning profile and join the platform.</h1>
                            <p className="typ-body">
                                Choose your role, create your account, and start with quizzes, lessons, and coding
                                challenges immediately.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                "Students can attempt quizzes and coding problems",
                                "Teachers can create courses and AI-powered assessments",
                                "Track progress and submissions in one dashboard",
                            ].map((item) => (
                                <div key={item} className="rounded-xl border border-border bg-surface/70 p-4">
                                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <UserCheck size={16} className="text-success" />
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
                                <h2 className="typ-h2 !text-3xl mb-1">Create Account</h2>
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
                                                className="input-base pl-10"
                                                placeholder="John Doe"
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
                                                className="input-base pl-10"
                                                placeholder="you@example.com"
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
                                                className="input-base pl-10 pr-11"
                                                placeholder="********"
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

                                    <div>
                                        <label className="label-base mb-1.5 block">I am a...</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleRoleChange("STUDENT")}
                                                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                                                    formData.role === "STUDENT"
                                                        ? "border-primary-blue bg-primary-blue/15 text-primary-cyan"
                                                        : "border-border bg-surface text-muted hover:text-gray-700"
                                                }`}
                                            >
                                                Student
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRoleChange("TEACHER")}
                                                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                                                    formData.role === "TEACHER"
                                                        ? "border-primary-blue bg-primary-blue/15 text-primary-cyan"
                                                        : "border-border bg-surface text-muted hover:text-gray-700"
                                                }`}
                                            >
                                                Teacher
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" disabled={loading} fullWidth size="lg">
                                    {loading ? "Creating Account..." : "Create Account"}
                                    {!loading ? <ArrowRight size={16} /> : <UserPlus size={16} />}
                                </Button>
                            </form>

                            <p className="mt-6 text-center typ-muted">
                                Already have an account?{" "}
                                <Link to="/login" className="font-semibold text-primary-cyan hover:text-primary-blue">
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
