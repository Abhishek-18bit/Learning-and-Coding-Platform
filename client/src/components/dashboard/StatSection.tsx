import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from '../AnimatedCounter';
import StatCard from '../ui/StatCard';
import { fadeIn, staggerContainer } from '../../animations/variants';

type StatTone = 'primary' | 'cyan' | 'success' | 'warning' | 'danger';

export interface StatSectionItem {
    label: string;
    value: number;
    icon: ReactNode;
    tone: StatTone;
    suffix?: string;
}

interface StatSectionProps {
    items: StatSectionItem[];
}

const StatSection = ({ items }: StatSectionProps) => {
    return (
        <motion.section variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {items.map((stat) => (
                <motion.div key={stat.label} variants={fadeIn}>
                    <StatCard
                        label={stat.label}
                        value={<AnimatedCounter from={0} to={stat.value} suffix="" />}
                        icon={stat.icon}
                        tone={stat.tone}
                        suffix={stat.suffix}
                    />
                </motion.div>
            ))}
        </motion.section>
    );
};

export default StatSection;
