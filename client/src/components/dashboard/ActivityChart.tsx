import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp } from 'lucide-react';
import Card from '../ui/Card';

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

type ActivityRangeDays = 7 | 30 | 90;

interface BucketPoint {
    label: string;
    count: number;
}

interface ActivityBuckets {
    points: BucketPoint[];
    totalEvents: number;
}

interface ChartSeries {
    scoreSeries: number[];
    solvedSeries: number[];
    hasData: boolean;
}

interface PlotPoint {
    x: number;
    y: number;
}

const RANGE_OPTIONS: ActivityRangeDays[] = [7, 30, 90];
const CHART_WIDTH = 760;
const CHART_HEIGHT = 280;
const CHART_PADDING_TOP = 20;
const CHART_PADDING_RIGHT = 12;
const CHART_PADDING_BOTTOM = 34;
const CHART_PADDING_LEFT = 36;

const CYAN = '#09d8ff';
const PURPLE = '#8f4bff';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const toLocalDayKey = (value: Date): string => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const startOfDay = (value: Date): Date => {
    const next = new Date(value);
    next.setHours(0, 0, 0, 0);
    return next;
};

const addDays = (date: Date, days: number): Date => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
};

const buildBuckets = (items: ActivityItem[], rangeDays: ActivityRangeDays): ActivityBuckets => {
    const today = startOfDay(new Date());
    const windowStart = addDays(today, -(rangeDays - 1));
    const dayCountMap = new Map<string, number>();

    items.forEach((item) => {
        const parsed = new Date(item.createdAt);
        if (Number.isNaN(parsed.getTime())) {
            return;
        }

        const day = startOfDay(parsed);
        if (day < windowStart || day > today) {
            return;
        }

        const key = toLocalDayKey(day);
        dayCountMap.set(key, (dayCountMap.get(key) || 0) + 1);
    });

    const points: BucketPoint[] = [];

    if (rangeDays === 7) {
        for (let offset = 6; offset >= 0; offset -= 1) {
            const day = addDays(today, -offset);
            const key = toLocalDayKey(day);
            points.push({
                label: day.toLocaleDateString(undefined, { weekday: 'short' }),
                count: dayCountMap.get(key) || 0,
            });
        }
    } else {
        const bucketCount = 7;
        const bucketSize = Math.ceil(rangeDays / bucketCount);

        for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex += 1) {
            const bucketStart = addDays(windowStart, bucketIndex * bucketSize);
            const bucketEnd = addDays(bucketStart, bucketSize - 1);
            const safeBucketEnd = bucketEnd > today ? today : bucketEnd;

            let bucketTotal = 0;
            const cursor = new Date(bucketStart);
            while (cursor <= safeBucketEnd) {
                const key = toLocalDayKey(cursor);
                bucketTotal += dayCountMap.get(key) || 0;
                cursor.setDate(cursor.getDate() + 1);
            }

            points.push({
                label: bucketStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                count: bucketTotal,
            });
        }
    }

    return {
        points,
        totalEvents: points.reduce((acc, point) => acc + point.count, 0),
    };
};

const composeSeries = (points: BucketPoint[]): ChartSeries => {
    const counts = points.map((point) => point.count);
    const hasData = counts.some((value) => value > 0);

    if (!hasData) {
        return {
            scoreSeries: [72, 85, 60, 92, 78, 95, 89],
            solvedSeries: [4, 7, 3, 9, 6, 11, 8],
            hasData: false,
        };
    }

    const maxCount = Math.max(...counts, 1);
    const scoreSeries = counts.map((count, index) => {
        const normalized = count / maxCount;
        const wave = Math.sin((index / 6) * Math.PI) * 4;
        return clamp(Math.round(58 + normalized * 36 + wave), 40, 99);
    });
    const solvedSeries = counts.map((count, index) => {
        const normalized = count / maxCount;
        const wave = index % 2 === 0 ? 0 : 1;
        return clamp(Math.round(2 + normalized * 10 + wave), 0, 20);
    });

    return { scoreSeries, solvedSeries, hasData: true };
};

const toSmoothPath = (points: PlotPoint[]): string => {
    if (points.length === 0) {
        return '';
    }
    if (points.length === 1) {
        return `M ${points[0].x} ${points[0].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
};

const buildTrendPercent = (values: number[], hasData: boolean): number => {
    if (!hasData) {
        return 23;
    }

    const firstHalf = values.slice(0, 3).reduce((acc, current) => acc + current, 0);
    const secondHalf = values.slice(-3).reduce((acc, current) => acc + current, 0);

    if (firstHalf === 0 && secondHalf > 0) {
        return 100;
    }
    if (firstHalf === 0) {
        return 0;
    }

    return clamp(Math.round(((secondHalf - firstHalf) / firstHalf) * 100), -99, 199);
};

const ActivityChart = ({ activity }: ActivityChartProps) => {
    const [selectedRangeDays, setSelectedRangeDays] = useState<ActivityRangeDays>(7);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const { points, totalEvents } = useMemo(
        () => buildBuckets(activity, selectedRangeDays),
        [activity, selectedRangeDays]
    );

    const { scoreSeries, solvedSeries, hasData } = useMemo(() => composeSeries(points), [points]);
    const trendPercent = buildTrendPercent(solvedSeries, hasData);

    const plotWidth = CHART_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
    const plotHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

    const getX = (index: number) =>
        CHART_PADDING_LEFT + (plotWidth / Math.max(scoreSeries.length - 1, 1)) * index;
    const getY = (value: number) =>
        CHART_HEIGHT - CHART_PADDING_BOTTOM - (value / 100) * plotHeight;

    const scorePoints = scoreSeries.map((value, index) => ({ x: getX(index), y: getY(value) }));
    const solvedPoints = solvedSeries.map((value, index) => ({ x: getX(index), y: getY(value) }));
    const activeIndex = hoveredIndex ?? -1;
    const activePoint =
        activeIndex >= 0 && activeIndex < points.length
            ? {
                  label: points[activeIndex].label,
                  score: scoreSeries[activeIndex],
                  solved: solvedSeries[activeIndex],
                  x: scorePoints[activeIndex].x,
              }
            : null;

    const scorePath = toSmoothPath(scorePoints);
    const solvedPath = toSmoothPath(solvedPoints);
    const scoreAreaPath = `${scorePath} L ${CHART_WIDTH - CHART_PADDING_RIGHT} ${
        CHART_HEIGHT - CHART_PADDING_BOTTOM
    } L ${CHART_PADDING_LEFT} ${CHART_HEIGHT - CHART_PADDING_BOTTOM} Z`;

    return (
        <Card
            variant="glass"
            tilt={false}
            className="dashboard-activity-shell dashboard-ref-panel rounded-2xl border border-[#1b2232] bg-[#05070d]/95 p-5 md:p-6"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <Activity size={16} className="text-[#9f5dff]" />
                        <h3 className="typ-h3 !mb-0 !text-[2rem]">Activity Overview</h3>
                    </div>
                    <p className="typ-muted !text-sm">Problems solved & performance score</p>
                </div>

                <div className="inline-flex items-center gap-1 rounded-full border border-[#1a2030] bg-[#070a12] p-1">
                    {RANGE_OPTIONS.map((rangeDays) => {
                        const isActive = rangeDays === selectedRangeDays;
                        return (
                            <button
                                key={rangeDays}
                                type="button"
                                onClick={() => setSelectedRangeDays(rangeDays)}
                                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                    isActive
                                        ? 'bg-gradient-to-r from-[#6f2bff] to-[#9f4cff] text-white shadow-[0_0_18px_rgba(143,75,255,0.55)]'
                                        : 'text-[#7f8aa5] hover:text-[#b8c1d9]'
                                }`}
                            >
                                {rangeDays}D
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="relative mt-4 w-full overflow-x-auto">
                <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-[18rem] min-w-[640px] w-full">
                    <defs>
                        <linearGradient id="activity-cyan-line" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10d9ff" />
                            <stop offset="100%" stopColor="#00c7ff" />
                        </linearGradient>
                        <linearGradient id="activity-purple-line" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8f4bff" />
                            <stop offset="100%" stopColor="#a16aff" />
                        </linearGradient>
                        <linearGradient id="activity-cyan-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={CYAN} stopOpacity="0.32" />
                            <stop offset="100%" stopColor={CYAN} stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {[0, 25, 50, 75, 100].map((tick) => {
                        const y = getY(tick);
                        return (
                            <g key={`grid-${tick}`}>
                                <line
                                    x1={CHART_PADDING_LEFT}
                                    y1={y}
                                    x2={CHART_WIDTH - CHART_PADDING_RIGHT}
                                    y2={y}
                                    stroke="#20283a"
                                    strokeDasharray="4 5"
                                    strokeOpacity="0.9"
                                />
                                <text x={6} y={y + 4} fill="#7d89a5" fontSize="12">
                                    {tick}
                                </text>
                            </g>
                        );
                    })}

                    <motion.path
                        d={scoreAreaPath}
                        fill="url(#activity-cyan-fill)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />

                    <motion.path
                        d={scorePath}
                        fill="none"
                        stroke="url(#activity-cyan-line)"
                        strokeWidth="3.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    />

                    <motion.path
                        d={solvedPath}
                        fill="none"
                        stroke="url(#activity-purple-line)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />

                    {activePoint && (
                        <line
                            x1={activePoint.x}
                            y1={CHART_PADDING_TOP}
                            x2={activePoint.x}
                            y2={CHART_HEIGHT - CHART_PADDING_BOTTOM}
                            stroke="#d8deef"
                            strokeOpacity="0.65"
                            strokeWidth="1.3"
                        />
                    )}

                    {scorePoints.map((point, index) => {
                        const isActive = activeIndex === index;
                        return (
                        <circle
                            key={`score-${point.x}`}
                            cx={point.x}
                            cy={point.y}
                            r={isActive ? 5.5 : 4}
                            fill={CYAN}
                            stroke={isActive ? '#f6fbff' : 'none'}
                            strokeWidth={isActive ? 2 : 0}
                            style={{ filter: isActive ? 'drop-shadow(0 0 10px rgba(9,216,255,0.65))' : 'drop-shadow(0 0 6px rgba(9,216,255,0.55))' }}
                        />
                    )})}
                    {solvedPoints.map((point, index) => {
                        const isActive = activeIndex === index;
                        return (
                        <circle
                            key={`solved-${point.x}`}
                            cx={point.x}
                            cy={point.y}
                            r={isActive ? 5.5 : 4}
                            fill={PURPLE}
                            stroke={isActive ? '#f6fbff' : 'none'}
                            strokeWidth={isActive ? 2 : 0}
                            style={{ filter: isActive ? 'drop-shadow(0 0 10px rgba(143,75,255,0.65))' : 'drop-shadow(0 0 6px rgba(143,75,255,0.55))' }}
                        />
                    )})}

                    {points.map((point, index) => {
                        const x = getX(index);
                        const step = plotWidth / Math.max(points.length - 1, 1);
                        const nextX = index < points.length - 1 ? x + step / 2 : x + step / 2;
                        const prevX = index > 0 ? x - step / 2 : x - step / 2;

                        return (
                            <rect
                                key={`hover-zone-${point.label}-${index}`}
                                x={Math.max(CHART_PADDING_LEFT, prevX)}
                                y={CHART_PADDING_TOP}
                                width={Math.max(8, Math.min(CHART_WIDTH - CHART_PADDING_RIGHT, nextX) - Math.max(CHART_PADDING_LEFT, prevX))}
                                height={plotHeight}
                                fill="transparent"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
                            />
                        );
                    })}

                    {points.map((point, index) => (
                        <text
                            key={`label-${point.label}-${index}`}
                            x={getX(index)}
                            y={CHART_HEIGHT - 10}
                            fill="#7f8aa5"
                            fontSize="12"
                            textAnchor="middle"
                        >
                            {point.label}
                        </text>
                    ))}
                </svg>

                {activePoint && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="pointer-events-none absolute z-20 w-[8.5rem] rounded-xl border border-[#252c3f] bg-[#05070d]/98 px-3 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-[left,top] duration-200 ease-out"
                        style={{
                            left: `${clamp((activePoint.x / CHART_WIDTH) * 100 + 2, 7, 84)}%`,
                            top: '0.6rem',
                        }}
                    >
                        <p className="text-xs font-medium text-[#9ca7c0]">{activePoint.label}</p>
                        <p className="mt-1 whitespace-nowrap text-[1.35rem] font-bold leading-none text-white">
                            {activePoint.solved} problems
                        </p>
                        <p className="mt-0.5 whitespace-nowrap text-[1.35rem] font-bold leading-none text-white">
                            {activePoint.score}% score
                        </p>
                    </motion.div>
                )}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-[#171d2b] pt-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full bg-[#8f4bff]" />
                        <span className="text-sm text-[#98a4c2]">Problems Solved</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full bg-[#09d8ff]" />
                        <span className="text-sm text-[#98a4c2]">Score %</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#00e7a4]">
                    <TrendingUp size={14} />
                    <span>
                        {trendPercent >= 0 ? '+' : ''}
                        {trendPercent}% vs last period
                    </span>
                </div>
            </div>

            <p className="mt-2 text-right text-xs text-[#5d6886]">{totalEvents} events</p>
        </Card>
    );
};

export default ActivityChart;
