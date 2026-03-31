import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Lock } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { achievementService } from '../services/achievement.service';
import { resolveAchievementIcon } from '../utils/achievementIcons';

const toPercent = (value: number) => Math.max(0, Math.min(100, value));

const AchievementsPage = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['my-achievements'],
        queryFn: () => achievementService.getMyAchievements(),
    });

    const badges = data?.badges || [];
    const groupedBadges = useMemo(() => {
        const groups = new Map<string, typeof badges>();
        badges.forEach((badge) => {
            const key = badge.category || 'GENERAL';
            const list = groups.get(key) || [];
            list.push(badge);
            groups.set(key, list);
        });
        return Array.from(groups.entries());
    }, [badges]);

    if (isLoading) {
        return (
            <div className="h-[65vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary-cyan" />
                <p className="typ-muted">Loading achievements...</p>
            </div>
        );
    }

    const totals = data?.totals || {
        earned: 0,
        total: 0,
        completionPercent: 0,
    };

    return (
        <div className="mx-auto max-w-[1400px] space-y-6">
            <Card variant="glass" className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="typ-h1 mb-1">Achievements</h1>
                        <p className="typ-muted">Earn badges as you progress through coding, quizzes, and battles.</p>
                    </div>
                    <Badge variant="primary">
                        {totals.earned}/{totals.total} unlocked
                    </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card variant="layered" className="space-y-2 p-4">
                        <p className="typ-muted uppercase">Completion</p>
                        <p className="text-3xl font-bold text-gray-900">{totals.completionPercent}%</p>
                        <ProgressBar value={toPercent(totals.completionPercent)} />
                    </Card>
                    <Card variant="layered" className="space-y-2 p-4">
                        <p className="typ-muted uppercase">Solved Problems</p>
                        <p className="text-3xl font-bold text-gray-900">{data?.highlights.solvedProblems || 0}</p>
                    </Card>
                    <Card variant="layered" className="space-y-2 p-4">
                        <p className="typ-muted uppercase">Battle Wins</p>
                        <p className="text-3xl font-bold text-gray-900">{data?.highlights.battleWins || 0}</p>
                    </Card>
                </div>
            </Card>

            {groupedBadges.length > 0 ? (
                groupedBadges.map(([category, badges]) => (
                    <Card key={category} variant="layered" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="typ-h2 !mb-0 !text-2xl">{category.replace('_', ' ')}</h2>
                            <Badge variant="muted">
                                {badges.filter((badge) => badge.earned).length}/{badges.length}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {badges.map((badge) => {
                                const Icon = resolveAchievementIcon(badge.icon);
                                const target = badge.progressTarget ?? 0;
                                const hasProgress = target > 0;
                                const progressPercent = hasProgress
                                    ? Math.round((badge.progressCurrent / target) * 100)
                                    : 0;

                                return (
                                    <Card
                                        key={badge.code}
                                        variant="glass"
                                        className={`space-y-3 p-4 ${badge.earned ? '' : 'opacity-90'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary-blue/45 bg-primary-blue/20 text-primary-cyan">
                                                <Icon size={18} />
                                            </span>
                                            {badge.earned ? (
                                                <Badge variant="success">Unlocked</Badge>
                                            ) : (
                                                <Badge variant="muted">
                                                    <Lock size={12} className="mr-1" />
                                                    Locked
                                                </Badge>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="typ-h3 !mb-1 !text-base">{badge.title}</h3>
                                            <p className="typ-muted">{badge.description}</p>
                                        </div>

                                        {badge.earned ? (
                                            <p className="text-xs text-muted">
                                                Earned on {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'N/A'}
                                            </p>
                                        ) : hasProgress ? (
                                            <div className="space-y-1">
                                                <ProgressBar value={toPercent(progressPercent)} />
                                                <p className="text-xs text-muted">
                                                    {badge.progressCurrent}/{badge.progressTarget}
                                                </p>
                                            </div>
                                        ) : null}
                                    </Card>
                                );
                            })}
                        </div>
                    </Card>
                ))
            ) : (
                <Card variant="glass" className="p-10 text-center">
                    <p className="typ-body">No achievements available yet.</p>
                </Card>
            )}
        </div>
    );
};

export default AchievementsPage;
