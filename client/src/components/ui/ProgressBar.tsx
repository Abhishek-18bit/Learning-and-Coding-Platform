import type { HTMLAttributes } from 'react';

interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    value: number;
    max?: number;
    showLabel?: boolean;
}

const ProgressBar = ({ value, max = 100, showLabel = false, className, ...props }: ProgressBarProps) => {
    const safe = Math.max(0, Math.min(max, value));
    const percent = Math.round((safe / max) * 100);

    return (
        <div className={className} {...props}>
            <progress className="progress-base w-full h-2.5" value={safe} max={max} />
            {showLabel && <p className="typ-muted mt-2">{percent}% complete</p>}
        </div>
    );
};

export default ProgressBar;
