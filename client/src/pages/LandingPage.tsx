import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer, hoverScale } from '../animations/variants';

const LandingPage = () => {
    return (
        <div className="relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl -z-10"></div>

            <motion.div
                initial="hidden"
                animate="visible"
                className="container mx-auto px-6 py-20 relative z-10"
            >
                <motion.div
                    variants={staggerContainer}
                    className="max-w-4xl mx-auto text-center space-y-8"
                >
                    <motion.h1
                        variants={fadeIn}
                        className="text-6xl md:text-7xl font-extrabold leading-tight"
                    >
                        Master Coding with <br />
                        <span className="text-gradient">Premium Experience</span>
                    </motion.h1>
                    <motion.p
                        variants={fadeIn}
                        className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed"
                    >
                        Level up your programming skills, crush technical interviews, and master quizzes
                        through our structured learning paths and real-time practice.
                    </motion.p>
                    <motion.div
                        variants={fadeIn}
                        className="flex items-center justify-center gap-6 pt-4"
                    >
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link to="/register" className="btn-gradient text-lg px-8 py-4">Start Learning Now</Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link to="/login" className="px-8 py-4 border-2 border-gray-200 rounded-xl font-bold hover:border-primary transition-all">View Courses</Link>
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Visual placeholder for features */}
                <motion.div
                    variants={staggerContainer}
                    viewport={{ once: true }}
                    whileInView="visible"
                    initial="hidden"
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32"
                >
                    {[
                        { title: "Structured Courses", desc: "Expert-led lessons covering everything from basics to advanced architectures." },
                        { title: "Real-time Coding", desc: "Built-in interactive code editor with instant feedback and test cases." },
                        { title: "Smart Quizzes", desc: "Multiple-choice questions designed to test your conceptual depth." }
                    ].map((feat, i) => (
                        <motion.div
                            key={i}
                            variants={fadeIn}
                            whileHover="hover"
                            className="card-premium text-center space-y-4 cursor-default"
                            custom={i}
                        >
                            <motion.h3 variants={hoverScale} className="text-2xl font-bold">{feat.title}</motion.h3>
                            <p className="text-secondary leading-relaxed">{feat.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default LandingPage;
