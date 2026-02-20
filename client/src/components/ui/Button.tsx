import { useEffect, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, MouseEvent, FocusEvent, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'btn-gradient',
    secondary: 'bg-surface-elevated text-gray-800 border border-border hover:bg-surface',
    ghost: 'bg-transparent text-gray-700 border border-transparent hover:bg-surface hover:border-border',
    danger: 'bg-error/20 text-error border border-error/40 hover:bg-error/30',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
};

const mergeClasses = (...classes: Array<string | undefined | false>) =>
    classes.filter(Boolean).join(' ');

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className,
    type = 'button',
    onMouseMove,
    onMouseLeave,
    onBlur,
    disabled,
    ...props
}: ButtonProps) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [isMagneticEnabled, setIsMagneticEnabled] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setIsMagneticEnabled(!coarsePointer && !reducedMotion);
    }, []);

    const setMagneticOffset = (event: MouseEvent<HTMLButtonElement>) => {
        if (!isMagneticEnabled || disabled) {
            return;
        }

        const element = buttonRef.current;
        if (!element) {
            return;
        }

        const rect = element.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8;

        element.style.setProperty('--magnetic-x', `${x.toFixed(2)}px`);
        element.style.setProperty('--magnetic-y', `${y.toFixed(2)}px`);
    };

    const resetMagneticOffset = () => {
        const element = buttonRef.current;
        if (!element) {
            return;
        }

        element.style.setProperty('--magnetic-x', '0px');
        element.style.setProperty('--magnetic-y', '0px');
    };

    const handleMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
        setMagneticOffset(event);
        onMouseMove?.(event);
    };

    const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
        resetMagneticOffset();
        onMouseLeave?.(event);
    };

    const handleBlur = (event: FocusEvent<HTMLButtonElement>) => {
        resetMagneticOffset();
        onBlur?.(event);
    };

    return (
        <button
            ref={buttonRef}
            type={type}
            className={mergeClasses(
                'btn-magnetic inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all dur-normal focus-glow disabled:opacity-50 disabled:cursor-not-allowed',
                variantClasses[variant],
                sizeClasses[size],
                fullWidth ? 'w-full' : '',
                className
            )}
            disabled={disabled}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onBlur={handleBlur}
            {...props}
        >
            <span className="btn-magnetic-content">{children}</span>
        </button>
    );
};

export default Button;
