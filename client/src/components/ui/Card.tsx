import { useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';

type CardVariant = 'default' | 'glass' | 'layered';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    variant?: CardVariant;
    hoverLift?: boolean;
    tilt?: boolean;
}

const mergeClasses = (...classes: Array<string | undefined | false>) =>
    classes.filter(Boolean).join(' ');

const variantClasses: Record<CardVariant, string> = {
    default: 'bg-card border border-border shadow-soft',
    glass: 'bg-surface/70 border border-border backdrop-blur-xl shadow-soft',
    layered: 'bg-card border border-border shadow-medium',
};

const Card = ({
    children,
    variant = 'default',
    hoverLift = false,
    tilt = true,
    className,
    onMouseMove,
    onMouseLeave,
    ...props
}: CardProps) => {
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [isTiltEnabled, setIsTiltEnabled] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setIsTiltEnabled(tilt && !coarsePointer && !reducedMotion);
    }, [tilt]);

    const setTiltValues = (event: MouseEvent<HTMLDivElement>) => {
        if (!isTiltEnabled) {
            return;
        }

        const element = cardRef.current;
        if (!element) {
            return;
        }

        const rect = element.getBoundingClientRect();
        if (rect.width > 920 || rect.height > 620) {
            return;
        }

        const offsetX = (event.clientX - rect.left) / rect.width;
        const offsetY = (event.clientY - rect.top) / rect.height;
        const rotateY = (offsetX - 0.5) * 9;
        const rotateX = (0.5 - offsetY) * 9;

        element.style.setProperty('--card-rotate-x', `${rotateX.toFixed(2)}deg`);
        element.style.setProperty('--card-rotate-y', `${rotateY.toFixed(2)}deg`);
        element.style.setProperty('--card-glow-x', `${(offsetX * 100).toFixed(1)}%`);
        element.style.setProperty('--card-glow-y', `${(offsetY * 100).toFixed(1)}%`);
    };

    const resetTiltValues = () => {
        const element = cardRef.current;
        if (!element) {
            return;
        }

        element.style.setProperty('--card-rotate-x', '0deg');
        element.style.setProperty('--card-rotate-y', '0deg');
        element.style.setProperty('--card-glow-x', '50%');
        element.style.setProperty('--card-glow-y', '50%');
    };

    const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
        setTiltValues(event);
        onMouseMove?.(event);
    };

    const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
        resetTiltValues();
        onMouseLeave?.(event);
    };

    return (
        <div
            ref={cardRef}
            className={mergeClasses(
                'relative overflow-hidden rounded-xl p-6 transition-all dur-normal',
                variantClasses[variant],
                isTiltEnabled ? 'card-tilt' : '',
                hoverLift ? 'card-hover-lift hover:shadow-strong' : '',
                className
            )}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
