import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { AlertTriangle, Loader2, Radio, Square, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../providers/SocketProvider';
import { onManagedSocketEvent } from '../../lib/socket';
import { battleService, type BattleLeaderboardEntry, type BattleRoomSnapshot, type BattleRoomStatus, type BattleSubmissionSummary } from '../../services/battle.service';
import { problemService } from '../../services/problem.service';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import BattleLobby from '../../components/battle/BattleLobby';
import BattleRoom from '../../components/battle/BattleRoom';
import ResultScreen from '../../components/battle/ResultScreen';

type BattlePhase = 'LOBBY' | 'LIVE' | 'RESULT';

interface RoomJoinedEvent {
    roomId: string;
    room: BattleRoomSnapshot;
}

interface ParticipantUpdateEvent {
    roomId: string;
    participantCount: number;
    connectedParticipants: number;
}

interface LeaderboardUpdateEvent {
    roomId: string;
    leaderboard: BattleLeaderboardEntry[];
}

interface BattleStartedEvent {
    roomId: string;
    remainingTimeMs: number;
}

interface BattleEndedEvent {
    roomId: string;
    leaderboard: BattleLeaderboardEntry[];
}

interface TimerSyncEvent {
    roomId: string;
    status: BattleRoomStatus;
    remainingTimeMs: number;
    serverTime: string;
}

interface SubmissionResultEvent {
    roomId: string;
    summary: BattleSubmissionSummary;
}

interface ErrorEventPayload {
    message?: string;
}

const statusBadgeVariant = (status: BattleRoomStatus): 'warning' | 'success' | 'error' => {
    if (status === 'WAITING') return 'warning';
    if (status === 'LIVE') return 'success';
    return 'error';
};

const getBattlePhase = (status: BattleRoomStatus): BattlePhase => {
    if (status === 'WAITING') return 'LOBBY';
    if (status === 'LIVE') return 'LIVE';
    return 'RESULT';
};

const BattleRoomPage = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { socket, connected } = useSocket();

    const [snapshot, setSnapshot] = useState<BattleRoomSnapshot | null>(null);
    const [roomStatus, setRoomStatus] = useState<BattleRoomStatus>('WAITING');
    const [participants, setParticipants] = useState(0);
    const [connectedParticipants, setConnectedParticipants] = useState(0);
    const [leaderboard, setLeaderboard] = useState<BattleLeaderboardEntry[]>([]);
    const [remainingTime, setRemainingTime] = useState(0);
    const [timerServerTime, setTimerServerTime] = useState<string | null>(null);
    const [battlePhase, setBattlePhase] = useState<BattlePhase>('LOBBY');
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('function solve(input) {\n  return input;\n}');
    const [codeTouched, setCodeTouched] = useState(false);
    const [submitSummary, setSubmitSummary] = useState<BattleSubmissionSummary | null>(null);
    const [submitError, setSubmitError] = useState('');
    const [socketMessage, setSocketMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isSocketDisconnected, setIsSocketDisconnected] = useState(false);

    const startFallbackRef = useRef<number | null>(null);

    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

    const roomQuery = useQuery({
        queryKey: ['battle-room', roomId],
        queryFn: () => battleService.getRoom(roomId!),
        enabled: Boolean(roomId && user),
    });

    const problemQuery = useQuery({
        queryKey: ['battle-problem', snapshot?.problemId],
        queryFn: () => problemService.getProblemById(snapshot!.problemId),
        enabled: Boolean(snapshot?.problemId),
    });

    const clearStartFallback = useCallback(() => {
        if (startFallbackRef.current) {
            window.clearTimeout(startFallbackRef.current);
            startFallbackRef.current = null;
        }
    }, []);

    const applySnapshot = useCallback((nextSnapshot: BattleRoomSnapshot) => {
        setSnapshot(nextSnapshot);
        setRoomStatus(nextSnapshot.status);
        setParticipants(nextSnapshot.participantCount);
        setConnectedParticipants(nextSnapshot.connectedParticipants);
        setLeaderboard(nextSnapshot.leaderboard || []);
        setRemainingTime(nextSnapshot.remainingTimeMs);
        setBattlePhase(getBattlePhase(nextSnapshot.status));
        if (nextSnapshot.status !== 'LIVE') {
            setIsSubmitting(false);
        }
    }, []);

    const endBattleMutation = useMutation({
        mutationFn: () => battleService.endRoom(roomId!),
        onSuccess: (nextSnapshot) => {
            applySnapshot(nextSnapshot);
            setSocketMessage('');
        },
        onError: (error) => {
            const axiosError = error as AxiosError<{ message?: string }>;
            setSocketMessage(axiosError.response?.data?.message || 'Unable to end battle.');
        },
    });

    useEffect(() => {
        if (!roomQuery.data) {
            return;
        }
        applySnapshot(roomQuery.data);
    }, [applySnapshot, roomQuery.data]);

    useEffect(() => {
        if (!problemQuery.data?.starterCode || codeTouched) {
            return;
        }
        setCode(problemQuery.data.starterCode);
    }, [codeTouched, problemQuery.data?.starterCode]);

    useEffect(() => {
        if (!socket || !roomId || !user) {
            return;
        }

        const unsubscribers = [
            onManagedSocketEvent(socket, 'room_joined', (payload: RoomJoinedEvent) => {
                if (!payload || payload.roomId !== roomId) {
                    return;
                }
                applySnapshot(payload.room);
                setSocketMessage('');
                setIsSocketDisconnected(false);
            }),
            onManagedSocketEvent(socket, 'participant_update', (payload: ParticipantUpdateEvent) => {
                if (!payload || payload.roomId !== roomId) {
                    return;
                }
                setParticipants(payload.participantCount);
                setConnectedParticipants(payload.connectedParticipants);
            }),
            onManagedSocketEvent(socket, 'leaderboard_update', (payload: LeaderboardUpdateEvent) => {
                if (!payload || payload.roomId !== roomId) {
                    return;
                }
                setLeaderboard(payload.leaderboard || []);
            }),
            onManagedSocketEvent(socket, 'battle_started', (payload: BattleStartedEvent) => {
                if (!payload || payload.roomId !== roomId) {
                    return;
                }
                clearStartFallback();
                setIsStarting(false);
                setRoomStatus('LIVE');
                setBattlePhase('LIVE');
                setRemainingTime(payload.remainingTimeMs || 0);
                setSocketMessage('');
            }),
            onManagedSocketEvent(socket, 'battle_ended', (payload: BattleEndedEvent) => {
                if (!payload || payload.roomId !== roomId) {
                    return;
                }
                clearStartFallback();
                setIsSubmitting(false);
                setIsStarting(false);
                setRoomStatus('ENDED');
                setBattlePhase('RESULT');
                setRemainingTime(0);
                setLeaderboard(payload.leaderboard || []);
            }),
            onManagedSocketEvent(socket, 'timer_sync', (payload: TimerSyncEvent) => {
                if (!payload || payload.roomId !== roomId) {
                    return;
                }
                setTimerServerTime(payload.serverTime || null);
                setRemainingTime(payload.remainingTimeMs || 0);
                setRoomStatus(payload.status);
                setBattlePhase(getBattlePhase(payload.status));
            }),
            onManagedSocketEvent(socket, 'submission_result', (payload: SubmissionResultEvent) => {
                if (!payload || payload.roomId !== roomId) {
                    return;
                }
                setIsSubmitting(false);
                setSubmitError('');
                setSubmitSummary(payload.summary);
            }),
            onManagedSocketEvent(socket, 'error_event', (payload: ErrorEventPayload) => {
                clearStartFallback();
                setIsSubmitting(false);
                setIsStarting(false);
                const message = payload?.message || 'Battle action failed.';
                setSubmitError(message);
                setSocketMessage(message);
            }),
            onManagedSocketEvent(socket, 'connect', () => {
                setIsSocketDisconnected(false);
                setSocketMessage('');
                socket.emit('join_room', { roomId });
                void roomQuery.refetch();
            }),
            onManagedSocketEvent(socket, 'disconnect', () => {
                setIsSocketDisconnected(true);
                setSocketMessage('Socket disconnected. Reconnecting...');
            }),
        ];

        socket.emit('join_room', { roomId });

        return () => {
            socket.emit('leave_room', { roomId });
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [applySnapshot, clearStartFallback, roomId, roomQuery.refetch, socket, user]);

    useEffect(() => () => {
        clearStartFallback();
    }, [clearStartFallback]);

    const currentUserEntry = useMemo(
        () => leaderboard.find((entry) => entry.userId === user?.id),
        [leaderboard, user?.id]
    );
    const currentUserRank = currentUserEntry?.rank ?? null;
    const currentUserAttempts = currentUserEntry?.attemptNumber ?? 0;

    const handleStartBattle = () => {
        if (!socket || !roomId || roomStatus !== 'WAITING') {
            return;
        }

        clearStartFallback();
        setIsStarting(true);
        setSubmitError('');
        socket.emit('start_battle', { roomId });
        startFallbackRef.current = window.setTimeout(() => {
            setIsStarting(false);
        }, 8000);
    };

    const handleEndBattle = () => {
        if (!roomId || endBattleMutation.isPending || roomStatus === 'ENDED') {
            return;
        }
        endBattleMutation.mutate();
    };

    const handleSubmitAttempt = () => {
        if (!socket || !roomId) {
            setSubmitError('Realtime connection unavailable. Please retry.');
            return;
        }
        if (roomStatus !== 'LIVE') {
            setSubmitError('Battle is not live.');
            return;
        }
        if (!code.trim()) {
            setSubmitError('Code cannot be empty.');
            return;
        }
        if (!connected) {
            setSubmitError('Socket disconnected. Reconnecting...');
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');
        socket.emit('submit_attempt', {
            roomId,
            code,
            language,
        });
    };

    if (authLoading) {
        return (
            <div className="flex h-[68vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary-cyan" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!roomId) {
        return <Navigate to="/app/battle" replace />;
    }

    if (roomQuery.isLoading && !snapshot) {
        return (
            <div className="flex h-[68vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary-cyan" />
            </div>
        );
    }

    if (roomQuery.isError && !snapshot) {
        return (
            <Card variant="layered" className="mx-auto mt-8 max-w-2xl space-y-4 text-center">
                <AlertTriangle className="mx-auto h-10 w-10 text-error" />
                <h2 className="typ-h2 !mb-0 !text-2xl">Unable to load battle room</h2>
                <p className="typ-muted">
                    {((roomQuery.error as AxiosError<{ message?: string }>)?.response?.data?.message) ||
                        'Battle room not found or access denied.'}
                </p>
                <div className="flex justify-center">
                    <Button variant="secondary" onClick={() => navigate('/app/battle')}>
                        Back to Battle Hub
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="mx-auto max-w-[1500px] space-y-6">
            <Card variant="glass" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="typ-h1 !mb-1 !text-3xl">Battle Room</h1>
                        <p className="typ-muted">
                            Room code: <span className="font-semibold text-primary-cyan">{snapshot?.roomCode || '--'}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusBadgeVariant(roomStatus)}>{roomStatus}</Badge>
                        <Badge variant={connected && !isSocketDisconnected ? 'success' : 'warning'}>
                            {connected && !isSocketDisconnected ? (
                                <>
                                    <Radio size={12} />
                                    Connected
                                </>
                            ) : (
                                <>
                                    <Square size={12} />
                                    Reconnecting
                                </>
                            )}
                        </Badge>
                        {currentUserRank ? <Badge variant="primary">Rank #{currentUserRank}</Badge> : null}
                        <Badge variant="muted">Attempts {currentUserAttempts}</Badge>
                    </div>
                </div>

                {socketMessage ? (
                    <p className="rounded-xl border border-warning/35 bg-warning/15 px-3 py-2 text-sm text-warning">
                        {socketMessage}
                    </p>
                ) : null}

                {isTeacher ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            className="!from-primary-cyan !via-primary-blue !to-primary-blue"
                            disabled={roomStatus !== 'WAITING' || isStarting || participants === 0}
                            onClick={handleStartBattle}
                        >
                            {isStarting ? <Loader2 size={16} className="animate-spin" /> : <Trophy size={16} />}
                            {isStarting ? 'Starting...' : 'Start Battle'}
                        </Button>

                        <Button
                            variant="danger"
                            size="sm"
                            disabled={roomStatus === 'ENDED' || endBattleMutation.isPending}
                            onClick={handleEndBattle}
                        >
                            {endBattleMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                            {endBattleMutation.isPending ? 'Ending...' : 'End Battle'}
                        </Button>
                    </div>
                ) : null}
            </Card>

            {battlePhase === 'LOBBY' ? (
                <BattleLobby
                    roomCode={snapshot?.roomCode || '--'}
                    status={roomStatus}
                    isTeacher={isTeacher}
                    participantCount={participants}
                    connectedParticipants={connectedParticipants}
                    participants={leaderboard}
                    isStarting={isStarting}
                    onStartBattle={handleStartBattle}
                />
            ) : null}

            {battlePhase === 'LIVE' ? (
                <BattleRoom
                    roomId={roomId}
                    status={roomStatus}
                    problem={problemQuery.data || null}
                    language={language}
                    code={code}
                    canSubmit={!isTeacher}
                    isSubmitting={isSubmitting}
                    participantCount={participants}
                    connectedParticipants={connectedParticipants}
                    leaderboard={leaderboard}
                    currentUserId={user.id}
                    remainingTimeMs={remainingTime}
                    timerServerTimeIso={timerServerTime}
                    submitSummary={submitSummary}
                    submitError={submitError}
                    onLanguageChange={setLanguage}
                    onCodeChange={(value) => {
                        setCode(value);
                        setCodeTouched(true);
                    }}
                    onSubmit={handleSubmitAttempt}
                    onTimerElapsed={() => {
                        if (roomStatus === 'LIVE') {
                            setBattlePhase('RESULT');
                        }
                    }}
                />
            ) : null}

            {battlePhase === 'RESULT' ? (
                <ResultScreen
                    leaderboard={leaderboard}
                    participantCount={participants}
                    connectedParticipants={connectedParticipants}
                    currentUserId={user.id}
                    onReturn={() => navigate('/app/dashboard')}
                />
            ) : null}
        </div>
    );
};

export default BattleRoomPage;
