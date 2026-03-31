import { memo } from 'react';
import { motion } from 'framer-motion';
import Badge from '../ui/Badge';
import type { BattleLeaderboardEntry } from '../../services/battle.service';

interface LeaderboardRowProps {
    entry: BattleLeaderboardEntry;
    isCurrentUser: boolean;
    isWinner: boolean;
    isEnded: boolean;
}

const formatTime = (timeTaken: number | null) => {
    if (timeTaken === null || Number.isNaN(timeTaken)) {
        return '--';
    }
    return `${(timeTaken / 1000).toFixed(2)}s`;
};

const formatPenalty = (penaltyTimeMs: number | null) => {
    if (penaltyTimeMs === null || Number.isNaN(penaltyTimeMs)) {
        return '--';
    }
    return `${(penaltyTimeMs / 1000).toFixed(1)}s`;
};

const statusVariant = (entry: BattleLeaderboardEntry): 'success' | 'warning' | 'muted' => {
    if (entry.isCorrect) {
        return 'success';
    }
    if (entry.solvedProblems > 0 || entry.attemptNumber > 0) {
        return 'warning';
    }
    return 'muted';
};

const statusLabel = (entry: BattleLeaderboardEntry) => {
    if (entry.isCorrect) {
        return 'Solved';
    }
    if (entry.attemptNumber > 0) {
        return 'Trying';
    }
    return 'Joined';
};

const LeaderboardRow = ({ entry, isCurrentUser, isWinner, isEnded }: LeaderboardRowProps) => {
    return (
        <motion.tr
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className={`border-b border-border/70 text-sm ${
                isWinner && isEnded
                    ? 'bg-gradient-to-r from-success/20 to-primary-blue/10'
                    : isCurrentUser
                        ? 'bg-primary-blue/10'
                        : 'bg-transparent'
            }`}
        >
            <td className="px-3 py-3 font-semibold text-gray-900">#{entry.rank}</td>
            <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{entry.name}</span>
                    {isCurrentUser ? <Badge variant="primary">You</Badge> : null}
                    {isWinner && isEnded ? <Badge variant="success">Winner</Badge> : null}
                </div>
            </td>
            <td className="px-3 py-3 font-semibold text-primary-cyan">{entry.score}</td>
            <td className="px-3 py-3 font-medium text-gray-700">{formatPenalty(entry.penaltyTimeMs)}</td>
            <td className="px-3 py-3 font-medium text-gray-700">{formatTime(entry.timeTaken)}</td>
            <td className="px-3 py-3 font-medium text-gray-700">
                {entry.attemptNumber}
                <span className="ml-1 text-xs text-muted">({entry.wrongAttempts} wrong)</span>
            </td>
            <td className="px-3 py-3">
                <Badge variant={statusVariant(entry)}>{statusLabel(entry)}</Badge>
                <p className="mt-1 text-xs text-muted">
                    {entry.solvedProblems}/{entry.totalProblems} solved
                </p>
            </td>
        </motion.tr>
    );
};

export default memo(LeaderboardRow);
