import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface ActivityItem {
    id: string;
    text: string;
    createdAt: string;
}

interface ActivityChartProps {
    activity: ActivityItem[];
    onOpenProblems?: () => void;
    onOpenQuizzes?: () => void;
    liveConnected?: boolean;
}

interface ChartEvent {
    id: string;
    text: string;
    createdAt: Date;
    timeLabel: string;
}

interface ChartPoint {
    dayKey: string;
    dayLabel: string;
    fullLabel: string;
    value: number;
    events: ChartEvent[];
}

interface ActivityDataset {
    points: ChartPoint[];
    totalEvents: number;
}

type ActivityRangeDays = 7 | 30 | 90;

const DEFAULT_DAY_WINDOW: ActivityRangeDays = 7;
const RANGE_OPTIONS: ActivityRangeDays[] = [7, 30, 90];
const CHART_WIDTH = 560;
const CHART_HEIGHT = 220;
const CHART_PADDING = 24;

const toLocalDayKey = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildSeries = (items: ActivityItem[], dayWindow: number): ActivityDataset => {
    const now = new Date();
    const points: ChartPoint[] = [];
    const keyIndexMap = new Map<string, number>();

    for (let i = dayWindow - 1; i >= 0; i -= 1) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        const dayKey = toLocalDayKey(day);
        const dayLabel = day.toLocaleDateString(undefined, { weekday: 'short' });
        const fullLabel = day.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

        keyIndexMap.set(dayKey, points.length);
        points.push({
            dayKey,
            dayLabel,
            fullLabel,
            value: 0,
            events: [],
        });
    }

    items.forEach((item) => {
        const date = new Date(item.createdAt);
        if (Number.isNaN(date.getTime())) {
            return;
        }

        const key = toLocalDayKey(date);
        const index = keyIndexMap.get(key);
        if (index === undefined) {
            return;
        }

        const event: ChartEvent = {
            id: item.id,
            text: item.text,
            createdAt: date,
            timeLabel: date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        };
        points[index].events.push(event);
    });

    let totalEvents = 0;
    points.forEach((point) => {
        point.events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        point.value = point.events.length;
        totalEvents += point.value;
    });

    return { points, totalEvents };
};

const toPath = (points: ChartPoint[], width: number, height: number, padding: number): string => {
    if (points.length === 0) return '';

    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const stepX = (width - padding * 2) / (points.length - 1 || 1);

    const coordinates = points.map((point, index) => {
        const x = padding + stepX * index;
        const y = height - padding - (point.value / maxValue) * (height - padding * 2);
        return { x, y };
    });

    return coordinates
        .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`)
        .join(' ');
};

const ActivityChart = ({ activity, onOpenProblems, onOpenQuizzes, liveConnected = false }: ActivityChartProps) => {
    const [selectedRangeDays, setSelectedRangeDays] = useState<ActivityRangeDays>(DEFAULT_DAY_WINDOW);
    const [hoveredDayKey, setHoveredDayKey] = useState<string | null>(null);
    const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
    const { points, totalEvents } = useMemo(
        () => buildSeries(activity, selectedRangeDays),
        [activity, selectedRangeDays]
    );

    useEffect(() => {
        if (points.length === 0) {
            setSelectedDayKey(null);
            return;
        }

        const hasCurrentSelection = selectedDayKey && points.some((point) => point.dayKey === selectedDayKey);
        if (hasCurrentSelection) {
            return;
        }

        const recentDayWithActivity = [...points].reverse().find((point) => point.value > 0);
        setSelectedDayKey(recentDayWithActivity?.dayKey || points[points.length - 1].dayKey);
    }, [points, selectedDayKey]);

    const path = toPath(points, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING);
    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const areaPath = `${path} L ${CHART_WIDTH - CHART_PADDING} ${CHART_HEIGHT - CHART_PADDING} L ${CHART_PADDING} ${CHART_HEIGHT - CHART_PADDING} Z`;
    const selectedPoint = points.find((point) => point.dayKey === selectedDayKey) || null;
    const hoveredPoint = points.find((point) => point.dayKey === hoveredDayKey) || null;

    const getPointCoordinates = (index: number) => {
        const x = CHART_PADDING + ((CHART_WIDTH - CHART_PADDING * 2) / (points.length - 1 || 1)) * index;
        const y = CHART_HEIGHT - CHART_PADDING - ((points[index].value || 0) / maxValue) * (CHART_HEIGHT - CHART_PADDING * 2);
        return { x, y };
    };

    return (
        <Card variant="glass" className="p-5 space-y-4 overflow-hidden">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="typ-h3 mb-0">Activity</h3>
                    <p className="typ-muted">Last {selectedRangeDays} days from your real activity feed.</p>
                </div>
                <div className="text-right">
                    <span className="typ-muted">{totalEvents} events</span>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">
                        Live {liveConnected ? 'On' : 'Syncing'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {RANGE_OPTIONS.map((rangeDays) => {
                    const selected = selectedRangeDays === rangeDays;
                    return (
                        <Button
                            key={rangeDays}
                            variant={selected ? 'primary' : 'ghost'}
                            size="sm"
                            className={selected ? '' : 'border border-border bg-surface-elevated'}
                            onClick={() => setSelectedRangeDays(rangeDays)}
                        >
                            {rangeDays}D
                        </Button>
                    );
                })}
            </div>

            <motion.div
                className="relative w-full overflow-x-auto"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: 'easeInOut' }}
            >
                <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full min-w-[520px] h-56">
                    <defs>
                        <linearGradient id="activity-line" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--color-primary-cyan)" />
                            <stop offset="50%" stopColor="var(--color-primary-blue)" />
                            <stop offset="100%" stopColor="var(--color-primary-violet)" />
                        </linearGradient>
                        <linearGradient id="activity-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--color-primary-blue)" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="var(--color-primary-blue)" stopOpacity="0.03" />
                        </linearGradient>
                    </defs>

                    {points.map((point, index) => {
                        const { x } = getPointCoordinates(index);
                        return (
                            <g key={`${point.dayLabel}-${index}`}>
                                <line
                                    x1={x}
                                    y1={CHART_PADDING}
                                    x2={x}
                                    y2={CHART_HEIGHT - CHART_PADDING}
                                    stroke="var(--color-border)"
                                    strokeOpacity="0.55"
                                    strokeWidth="1"
                                />
                                <text
                                    x={x}
                                    y={CHART_HEIGHT - 4}
                                    fill="var(--color-muted)"
                                    fontSize="11"
                                    textAnchor="middle"
                                >
                                    {point.dayLabel}
                                </text>
                            </g>
                        );
                    })}

                    {[0, Math.ceil(maxValue / 2), maxValue].map((tick) => {
                        const y = CHART_HEIGHT - CHART_PADDING - (tick / maxValue) * (CHART_HEIGHT - CHART_PADDING * 2);
                        return (
                            <g key={`tick-${tick}`}>
                                <line
                                    x1={CHART_PADDING}
                                    y1={y}
                                    x2={CHART_WIDTH - CHART_PADDING}
                                    y2={y}
                                    stroke="var(--color-border)"
                                    strokeOpacity="0.7"
                                    strokeWidth="1"
                                />
                                <text x={8} y={y + 4} fill="var(--color-muted)" fontSize="11">
                                    {tick}
                                </text>
                            </g>
                        );
                    })}

                    {path && (
                        <>
                            <motion.path
                                d={areaPath}
                                fill="url(#activity-fill)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.26, ease: 'easeInOut' }}
                            />
                            <motion.path
                                d={path}
                                fill="none"
                                stroke="url(#activity-line)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.28, ease: 'easeInOut' }}
                            />
                            {points.map((point, index) => {
                                const { x, y } = getPointCoordinates(index);
                                const isSelected = point.dayKey === selectedDayKey;
                                const isHovered = point.dayKey === hoveredDayKey;
                                return (
                                    <motion.circle
                                        key={`point-${point.dayKey}`}
                                        cx={x}
                                        cy={y}
                                        r={isSelected ? 6 : point.value > 0 ? 5 : 4}
                                        fill={point.value > 0 ? 'url(#activity-line)' : 'var(--color-surface-elevated)'}
                                        stroke={isSelected || isHovered ? 'var(--color-primary-cyan)' : 'var(--color-border)'}
                                        strokeWidth={isSelected || isHovered ? 2 : 1.5}
                                        className="cursor-pointer"
                                        onMouseEnter={() => setHoveredDayKey(point.dayKey)}
                                        onMouseLeave={() => setHoveredDayKey((prev) => (prev === point.dayKey ? null : prev))}
                                        onFocus={() => setHoveredDayKey(point.dayKey)}
                                        onBlur={() => setHoveredDayKey((prev) => (prev === point.dayKey ? null : prev))}
                                        onClick={() => setSelectedDayKey(point.dayKey)}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`${point.fullLabel}: ${point.value} events`}
                                        whileHover={{ scale: 1.08 }}
                                        transition={{ duration: 0.16 }}
                                    />
                                );
                            })}
                        </>
                    )}
                </svg>

                {hoveredPoint && (
                    <div
                        className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-soft backdrop-blur"
                        style={{
                            left: `${Math.min(92, Math.max(8, ((CHART_PADDING + ((CHART_WIDTH - CHART_PADDING * 2) / (points.length - 1 || 1)) * points.findIndex((point) => point.dayKey === hoveredPoint.dayKey)) / CHART_WIDTH) * 100))}%`,
                            top: '0.5rem',
                        }}
                    >
                        <p className="text-xs font-semibold text-gray-900">{hoveredPoint.fullLabel}</p>
                        <p className="text-xs text-muted">{hoveredPoint.value} events</p>
                        {hoveredPoint.events[0] && (
                            <p className="mt-1 max-w-[16rem] truncate text-xs text-gray-700">{hoveredPoint.events[0].text}</p>
                        )}
                    </div>
                )}
            </motion.div>

            {selectedPoint && (
                <div className="rounded-xl border border-border bg-surface/60 p-4">
                    <div className="mb-3">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900">{selectedPoint.fullLabel}</h4>
                            <p className="text-xs text-muted">{selectedPoint.value} events in this day</p>
                        </div>
                    </div>

                    {selectedPoint.events.length > 0 ? (
                        <div className="space-y-2">
                            {selectedPoint.events.slice(0, 6).map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card/70 px-3 py-2"
                                >
                                    <p className="text-sm text-gray-700">{event.text}</p>
                                    <span className="whitespace-nowrap text-xs text-muted">{event.timeLabel}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3 rounded-lg border border-border bg-card/70 px-3 py-4 text-center">
                            <p className="text-sm text-gray-700">No activity on this day yet.</p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <Button variant="secondary" size="sm" onClick={onOpenProblems}>
                                    Solve Problems <ArrowRight size={14} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={onOpenQuizzes}>
                                    Attempt Quiz <ArrowRight size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default ActivityChart;
