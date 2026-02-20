import { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import Card from '../ui/Card';
import LeaderboardRow from './LeaderboardRow';
import type { BattleLeaderboardEntry } from '../../services/battle.service';

interface LiveLeaderboardProps {
    entries: BattleLeaderboardEntry[];
    currentUserId?: string;
    isEnded: boolean;
    participantCount: number;
    connectedParticipants: number;
}

const LiveLeaderboard = ({
    entries,
    currentUserId,
    isEnded,
    participantCount,
    connectedParticipants,
}: LiveLeaderboardProps) => {
    const renderedEntries = useMemo(
        () => entries.slice(0, 100),
        [entries]
    );

    const winnerId = renderedEntries.find((entry) => entry.isCorrect)?.userId || renderedEntries[0]?.userId;

    return (
        <Card variant="glass" className="h-full min-h-0 p-0">
            <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
                <div>
                    <h3 className="typ-h3 !mb-0 !text-lg">Live Leaderboard</h3>
                    <p className="typ-muted !mt-0">
                        {connectedParticipants} active / {participantCount} joined
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-primary-cyan/40 bg-primary-cyan/10 px-3 py-1 text-xs font-semibold text-primary-cyan">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary-cyan" />
                    LIVE
                </div>
            </div>

            <div className="max-h-[480px] overflow-auto">
                <table className="w-full min-w-[520px] border-collapse">
                    <thead className="sticky top-0 bg-card/95 backdrop-blur-md">
                        <tr className="border-b border-border/80 text-left text-xs uppercase tracking-wide text-muted">
                            <th className="px-3 py-2 font-semibold">Rank</th>
                            <th className="px-3 py-2 font-semibold">Participant</th>
                            <th className="px-3 py-2 font-semibold">Time</th>
                            <th className="px-3 py-2 font-semibold">Attempts</th>
                            <th className="px-3 py-2 font-semibold">Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        <AnimatePresence initial={false}>
                            {renderedEntries.map((entry) => (
                                <LeaderboardRow
                                    key={entry.userId}
                                    entry={entry}
                                    isCurrentUser={entry.userId === currentUserId}
                                    isWinner={entry.userId === winnerId}
                                    isEnded={isEnded}
                                />
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>

                {renderedEntries.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted">
                        No participants yet. Waiting for battle activity.
                    </div>
                ) : null}
            </div>
        </Card>
    );
};

export default LiveLeaderboard;
