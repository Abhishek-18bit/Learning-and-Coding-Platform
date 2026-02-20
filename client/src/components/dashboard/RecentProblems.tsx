import { motion } from 'framer-motion';
import { ArrowRight, Clock3 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

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

const RecentProblems = ({ items, onOpenProblems }: RecentProblemsProps) => {
    const visible = items.slice(0, 6);

    return (
        <Card variant="glass" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="typ-h3 mb-0">Recent Problems</h3>
                    <p className="typ-muted">Live timeline from your latest coding activity.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={onOpenProblems}>
                    View All <ArrowRight size={14} />
                </Button>
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
                            transition={{ duration: 0.24, delay: index * 0.04, ease: 'easeInOut' }}
                            whileHover={{ y: -3 }}
                        >
                            <Card
                                variant="layered"
                                className="p-4 transition-all dur-normal hover:border-primary-blue/60 hover:shadow-medium"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="typ-body !leading-6">{item.text}</p>
                                    <Badge variant={getBadge(item.text)}>
                                        {getBadge(item.text) === 'success'
                                            ? 'Solved'
                                            : getBadge(item.text) === 'warning'
                                            ? 'Attempted'
                                            : 'Activity'}
                                    </Badge>
                                </div>
                                <div className="mt-2 flex items-center gap-2 typ-muted">
                                    <Clock3 size={14} />
                                    <span>{toRelative(item.createdAt)}</span>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default RecentProblems;
