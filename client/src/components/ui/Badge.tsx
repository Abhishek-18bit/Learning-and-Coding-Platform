import type { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'muted' | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    children: ReactNode;
    variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-surface-elevated text-gray-700 border border-border',
    primary: 'bg-primary-blue/20 text-primary-cyan border border-primary-blue/40',
    success: 'bg-success/20 text-success border border-success/40',
    warning: 'bg-warning/20 text-warning border border-warning/40',
    error: 'bg-error/20 text-error border border-error/40',
    muted: 'bg-surface text-muted border border-border',
    outline: 'bg-transparent text-gray-700 border border-border',
};

const mergeClasses = (...classes: Array<string | undefined | false>) =>
    classes.filter(Boolean).join(' ');

const Badge = ({ children, variant = 'default', className, ...props }: BadgeProps) => {
    return (
        <span
            className={mergeClasses(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors dur-fast',
                variantClasses[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;
