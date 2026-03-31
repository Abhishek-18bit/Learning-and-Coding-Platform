import { Users, PlayCircle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import type { BattleLeaderboardEntry, BattleRoomStatus } from '../../services/battle.service';

interface BattleLobbyProps {
    roomCode: string;
    status: BattleRoomStatus;
    isTeacher: boolean;
    participantCount: number;
    connectedParticipants: number;
    participants: BattleLeaderboardEntry[];
    isStarting: boolean;
    onStartBattle: () => void;
}

const BattleLobby = ({
    roomCode,
    status,
    isTeacher,
    participantCount,
    connectedParticipants,
    participants,
    isStarting,
    onStartBattle,
}: BattleLobbyProps) => {
    const isWaiting = status === 'WAITING';

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card variant="glass" className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="typ-h2 !mb-1 !text-2xl">Battle Lobby</h2>
                        <p className="typ-muted">
                            Room code: <span className="font-semibold text-primary-cyan">{roomCode}</span>
                        </p>
                    </div>
                    <Badge variant={isWaiting ? 'warning' : 'success'}>
                        {isWaiting ? 'Waiting' : 'Live'}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Joined</p>
                        <p className="text-2xl font-bold text-gray-900">{participantCount}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Connected</p>
                        <p className="text-2xl font-bold text-gray-900">{connectedParticipants}</p>
                    </div>
                </div>

                <div>
                    <p className="mb-3 text-sm font-semibold text-gray-700">Participants</p>
                    <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                        {participants.length > 0 ? (
                            participants.map((entry) => (
                                <div
                                    key={entry.userId}
                                    className="rounded-xl border border-border bg-card/70 px-3 py-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="inline-flex items-center gap-2">
                                            <span className="h-2.5 w-2.5 rounded-full bg-primary-cyan" />
                                            <span className="font-medium text-gray-800">{entry.name}</span>
                                        </div>
                                        <Badge variant={entry.attemptNumber > 0 ? 'warning' : 'muted'}>
                                            {entry.attemptNumber > 0 ? `${entry.score} pts` : 'Waiting'}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-muted">
                                        {entry.solvedProblems}/{entry.totalProblems} solved
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-xl border border-border bg-card/70 px-4 py-6 text-center text-sm text-muted">
                                No participants joined yet.
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <Card variant="layered" className="space-y-5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-blue/20 text-primary-cyan">
                    <Users size={22} />
                </div>

                <div className="space-y-2">
                    <h3 className="typ-h3 !mb-0 !text-xl">Ready to launch?</h3>
                    {isTeacher ? (
                        <p className="typ-muted">
                            Start battle when everyone is in. The timer and leaderboard will sync instantly.
                        </p>
                    ) : (
                        <p className="typ-muted">
                            Waiting for your teacher to start the battle. Keep your editor and strategy ready.
                        </p>
                    )}
                </div>

                {isTeacher ? (
                    <Button
                        variant="primary"
                        className="!from-primary-cyan !via-primary-blue !to-primary-blue"
                        fullWidth
                        disabled={!isWaiting || participantCount === 0 || isStarting}
                        onClick={onStartBattle}
                    >
                        <PlayCircle size={16} />
                        {isStarting ? 'Starting...' : 'Start Battle'}
                    </Button>
                ) : (
                    <div className="rounded-xl border border-border bg-card/70 px-4 py-3 text-sm text-muted">
                        Battle controls are available only to the teacher.
                    </div>
                )}
            </Card>
        </div>
    );
};

export default BattleLobby;
