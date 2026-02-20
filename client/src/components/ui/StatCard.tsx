import type { ReactNode } from 'react';
import Card from './Card';

type StatTone = 'primary' | 'cyan' | 'success' | 'warning' | 'danger';

interface StatCardProps {
    label: string;
    value: ReactNode;
    icon: ReactNode;
    tone?: StatTone;
    suffix?: ReactNode;
}

const toneClasses: Record<StatTone, string> = {
    primary: 'bg-primary-blue/15 text-primary-cyan',
    cyan: 'bg-primary-cyan/15 text-primary-cyan',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-error/15 text-error',
};

const StatCard = ({ label, value, icon, tone = 'primary', suffix }: StatCardProps) => {
    return (
        <Card variant="layered" hoverLift className="group flex items-center gap-5">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform dur-normal group-hover:rotate-6 ${toneClasses[tone]}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="typ-muted !leading-4 font-semibold uppercase tracking-wider">{label}</p>
                <p className="mt-1 text-3xl font-extrabold text-gray-900">
                    {value}
                    {suffix ? <span className="ml-1 text-xl">{suffix}</span> : null}
                </p>
            </div>
        </Card>
    );
};

export default StatCard;
