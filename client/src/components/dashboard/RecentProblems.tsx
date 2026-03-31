import { motion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, Circle, Clock3, Code2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface ActivityItem {
    id: string;
    text: string;
    createdAt: string;
}

interface RecentProblemsProps {
    items: ActivityItem[];
    onOpenProblems: () => void;
}

const toRelative = (value: string) => {
    const date = new Date(value);
    const deltaMs = Date.now() - date.getTime();
    const deltaMin = Math.max(1, Math.floor(deltaMs / 60000));
    if (deltaMin < 60) return `${deltaMin}m ago`;
    const deltaHr = Math.floor(deltaMin / 60);
    if (deltaHr < 24) return `${deltaHr}h ago`;
    const deltaDay = Math.floor(deltaHr / 24);
    return `${deltaDay}d ago`;
};

const getBadge = (text: string): 'success' | 'warning' | 'muted' => {
    const normalized = text.toLowerCase();
    if (normalized.includes('accepted') || normalized.includes('solved')) return 'success';
    if (normalized.includes('attempt') || normalized.includes('wrong')) return 'warning';
    return 'muted';
};

const parseTitle = (text: string) => {
    const quoted = text.match(/"([^"]+)"/);
    if (quoted?.[1]) return quoted[1];

    const stripped = text
        .replace(/^(solved|attempted)\s+problem\s*/i, '')
        .replace(/\(([^)]+)\)\s*$/i, '')
        .trim();

    return stripped.length > 0 ? stripped : text;
};

const parseMeta = (text: string) => {
    const meta = text.match(/\(([^)]+)\)/)?.[1]?.trim();
    if (!meta) return 'Activity';
    return meta.replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusLabel = (variant: 'success' | 'warning' | 'muted') => {
    if (variant === 'success') return 'Solved';
    if (variant === 'warning') return 'Attempted';
    return 'Activity';
};

const getStatusBadgeClass = (variant: 'success' | 'warning' | 'muted') => {
    if (variant === 'success') return 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300';
    if (variant === 'warning') return 'border-amber-400/35 bg-amber-400/15 text-amber-300';
    return 'border-border bg-surface text-gray-600';
};

const getMetaBadgeClass = (variant: 'success' | 'warning' | 'muted') => {
    if (variant === 'success') return 'border-border/70 bg-[#0b0f18] text-[#77839f]';
    if (variant === 'warning') return 'border-border/70 bg-[#0b0f18] text-[#77839f]';
    return 'border-border/70 bg-[#0b0f18] text-[#77839f]';
};

const StatusIcon = ({ variant }: { variant: 'success' | 'warning' | 'muted' }) => {
    if (variant === 'success') {
        return (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/28 bg-emerald-500/12 text-emerald-300">
                <CheckCircle2 size={16} />
            </span>
        );
    }

    if (variant === 'warning') {
        return (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/35 bg-amber-400/8 text-amber-300">
                <Circle size={16} />
            </span>
        );
    }

    return (
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-gray-600">
            <Circle size={16} />
        </span>
    );
};

const RecentProblems = ({ items, onOpenProblems }: RecentProblemsProps) => {
    const visible = items.slice(0, 6);

    return (
        <Card variant="glass" className="space-y-4 dashboard-ref-panel rounded-3xl border border-[#1b2232] bg-[#05070d]/95 p-4 md:p-5">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Code2 size={18} className="text-[#00d7ff]" />
                    <h3 className="typ-h3 mb-0 !text-[2rem]">Recent Problems</h3>
                </div>
                <button
                    type="button"
                    onClick={onOpenProblems}
                    className="inline-flex items-center gap-1 text-[0.95rem] font-semibold text-[#9b63ff] transition-colors duration-200 hover:text-[#c59cff]"
                >
                    View All <ArrowUpRight size={14} />
                </button>
            </div>

            {visible.length === 0 ? (
                <Card variant="layered" className="p-4">
                    <p className="typ-muted">No recent problem activity yet.</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {visible.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.34, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ y: -2 }}
                        >
                            <Card
                                variant="layered"
                                tilt={false}
                                className="dashboard-recent-item dashboard-recent-problem-row rounded-3xl border border-[#171d2a] bg-[#04060b] px-4 py-3.5 transition-all dur-normal"
                            >
                                {(() => {
                                    const variant = getBadge(item.text);
                                    const title = parseTitle(item.text);
                                    const meta = parseMeta(item.text);
                                    const statusLabel = getStatusLabel(variant);

                                    return (
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex items-center gap-3">
                                                <StatusIcon variant={variant} />
                                                <div className="min-w-0">
                                                    <p className="truncate text-[1.4rem] font-semibold text-white">{title}</p>
                                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                        <Badge variant="outline" className={getStatusBadgeClass(variant)}>
                                                            {statusLabel}
                                                        </Badge>
                                                        <Badge variant="outline" className={getMetaBadgeClass(variant)}>
                                                            {meta}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0 flex items-center gap-1.5 text-[0.95rem] text-[#7e8aa7]">
                                                <Clock3 size={14} />
                                                <span>{toRelative(item.createdAt).replace(' ago', '')}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default RecentProblems;
