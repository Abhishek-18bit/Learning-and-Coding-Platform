import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Card from './Card';

type StatTone = 'primary' | 'cyan' | 'success' | 'warning' | 'danger';

interface StatCardProps {
    label: string;
    value: ReactNode;
    icon: ReactNode;
    tone?: StatTone;
    suffix?: ReactNode;
    trend?: string;
    subLabel?: string;
}

const toneClasses: Record<StatTone, string> = {
    primary: 'dashboard-stat-icon-skin',
    cyan: 'dashboard-stat-icon-skin',
    success: 'dashboard-stat-icon-skin',
    warning: 'dashboard-stat-icon-skin',
    danger: 'dashboard-stat-icon-skin',
};

const StatCard = ({ label, value, icon, tone = 'primary', suffix, trend, subLabel }: StatCardProps) => {
    return (
        <Card
            variant="layered"
            hoverLift
            tilt={false}
            className={`dashboard-stat-card dashboard-stat-tone-${tone} group`}
        >
            <div className="dashboard-stat-toprow">
                <div className={`dashboard-stat-icon dashboard-stat-icon-skin flex h-12 w-12 items-center justify-center rounded-xl transition-transform dur-normal ${toneClasses[tone]}`}>
                    {icon}
                </div>
                <span className="dashboard-stat-trend">
                    <ArrowUpRight size={13} />
                    {trend || '+0%'}
                </span>
            </div>
            <div className="dashboard-stat-content">
                <p className="dashboard-stat-number text-3xl font-extrabold text-gray-900">
                    {value}
                    {suffix ? <span className="ml-1 text-xl">{suffix}</span> : null}
                </p>
                <p className="dashboard-stat-title">{label}</p>
                <p className="dashboard-stat-subtitle">{subLabel || ''}</p>
            </div>
        </Card>
    );
};

export default StatCard;
