import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

interface AnimatedCounterProps {
    from: number;
    to: number;
    duration?: number;
    suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ from, to, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(from);

    useEffect(() => {
        const controls = animate(from, to, {
            duration,
            onUpdate: (value) => setCount(Math.floor(value)),
            ease: "easeOut",
        });

        return () => controls.stop();
    }, [from, to, duration]);

    return <span>{count}{suffix}</span>;
};

export default AnimatedCounter;
