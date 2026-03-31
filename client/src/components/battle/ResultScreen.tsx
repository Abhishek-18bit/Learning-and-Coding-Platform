import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Gauge } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LiveLeaderboard from './LiveLeaderboard';
import type { BattleLeaderboardEntry } from '../../services/battle.service';

interface ResultScreenProps {
    leaderboard: BattleLeaderboardEntry[];
    participantCount: number;
    connectedParticipants: number;
    currentUserId?: string;
    onReturn: () => void;
}

const ResultScreen = ({
    leaderboard,
    participantCount,
    connectedParticipants,
    currentUserId,
    onReturn,
}: ResultScreenProps) => {
    const winner = leaderboard[0];

    const summary = useMemo(() => {
        const solvedRows = leaderboard.filter((entry) => entry.isCorrect);
        const solvedCount = solvedRows.length;
        const solveRate = participantCount > 0 ? Math.round((solvedCount / participantCount) * 100) : 0;
        const averageScore = leaderboard.length
            ? Math.round(leaderboard.reduce((acc, row) => acc + row.score, 0) / leaderboard.length)
            : 0;
        const avgSolveTimeMs = solvedRows.length
            ? Math.round(
                  solvedRows.reduce((acc, row) => acc + (row.timeTaken || 0), 0) / solvedRows.length
              )
            : 0;

        return {
            solvedCount,
            solveRate,
            averageScore,
            avgSolveTimeMs,
        };
    }, [leaderboard, participantCount]);

    return (
        <div className="space-y-6">
            <Card variant="glass" className="relative overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary-cyan/25 blur-3xl"
                />

                <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <Badge variant="success">Battle Finished</Badge>
                        <h2 className="typ-h2 !mb-0 !text-3xl">Final Standings</h2>
                        <p className="typ-muted">
                            {winner ? (
                                <>
                                    Winner: <span className="font-semibold text-primary-cyan">{winner.name}</span>
                                </>
                            ) : (
                                'No winner yet.'
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-border bg-card/75 px-4 py-3">
                            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-muted">
                                <Users size={12} />
                                Participants
                            </p>
                            <p className="text-xl font-bold text-gray-900">{participantCount}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card/75 px-4 py-3">
                            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-muted">
                                <Trophy size={12} />
                                Solve Rate
                            </p>
                            <p className="text-xl font-bold text-gray-900">{summary.solveRate}%</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card/75 px-4 py-3">
                            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-muted">
                                <Gauge size={12} />
                                Avg Score
                            </p>
                            <p className="text-xl font-bold text-gray-900">{summary.averageScore}</p>
                        </div>
                    </div>
                </div>
            </Card>

            <Card variant="layered" className="!py-4">
                <p className="text-sm text-muted">
                    Scoring: difficulty-weighted solve points + speed bonus, with penalties for wrong attempts.
                </p>
                <p className="mt-1 text-xs text-muted">
                    Tie-breakers: lower penalty time, fewer attempts, then earlier submission.
                </p>
            </Card>

            <div className="h-[540px]">
                <LiveLeaderboard
                    entries={leaderboard}
                    currentUserId={currentUserId}
                    isEnded
                    participantCount={participantCount}
                    connectedParticipants={connectedParticipants}
                />
            </div>

            <div className="flex justify-end">
                <Button variant="secondary" onClick={onReturn}>
                    Return to Dashboard
                </Button>
            </div>
        </div>
    );
};

export default ResultScreen;
