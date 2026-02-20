import type { Variants } from 'framer-motion';

export const fadeIn: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
    }
};

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.06,
            delayChildren: 0.08
        }
    }
};

export const hoverScale: Variants = {
    initial: { scale: 1 },
    hover: {
        scale: 1.02,
        transition: { duration: 0.22, ease: 'easeOut' }
    },
    tap: { scale: 0.98 }
};

export const slideInRight: Variants = {
    hidden: { x: 50, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: 0.24, ease: 'easeOut' }
    }
};

export const pageTransition: Variants = {
    initial: { opacity: 0, x: -10 },
    animate: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.24 }
    },
    exit: {
        opacity: 0,
        x: 10,
        transition: { duration: 0.24 }
    }
};
