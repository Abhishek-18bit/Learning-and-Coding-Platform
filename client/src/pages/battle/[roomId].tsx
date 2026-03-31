import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { AlertTriangle, Loader2, Radio, Square, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../providers/SocketProvider';
import { onManagedSocketEvent } from '../../lib/socket';
import {
    battleService,
    type BattleLeaderboardEntry,
    type BattleRoomSnapshot,
    type BattleRoomStatus,
    type BattleSubmissionSummary,
} from '../../services/battle.service';
import { problemService } from '../../services/problem.service';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import BattleLobby from '../../components/battle/BattleLobby';
import BattleRoom from '../../components/battle/BattleRoom';
import ResultScreen from '../../components/battle/ResultScreen';
import BattleBackground from '../../components/battle/BattleBackground';

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
    reason?: 'MANUAL' | 'TIME_UP';
    teacherNote?: string | null;
    endedByUserId?: string | null;
    endedAt?: string | null;
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
    problemId?: string;
    summary: BattleSubmissionSummary;
}

interface ErrorEventPayload {
    message?: string;
    statusCode?: number;
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

const isSessionMismatchIssue = (message?: string, statusCode?: number) => {
    if (statusCode === 401) {
        return true;
    }

    const normalizedMessage = String(message || '').toLowerCase();
    return (
        normalizedMessage.includes('socket identity mismatch') ||
        normalizedMessage.includes('unauthorized socket request') ||
        normalizedMessage.includes('invalid token') ||
        normalizedMessage.includes('jwt')
    );
};

const getSessionMismatchNotice = () =>
    'Session mismatch detected for this battle tab. Reload this tab or login again.';

const DEFAULT_BATTLE_CODE = 'function solve(input) {\n  return input;\n}';

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
    const [activeProblemId, setActiveProblemId] = useState('');
    const [codeByProblem, setCodeByProblem] = useState<Record<string, string>>({});
    const [submitSummary, setSubmitSummary] = useState<BattleSubmissionSummary | null>(null);
    const [submitError, setSubmitError] = useState('');
    const [socketMessage, setSocketMessage] = useState('');
    const [sessionMismatchNotice, setSessionMismatchNotice] = useState('');
    const [showEndBattleModal, setShowEndBattleModal] = useState(false);
    const [endBattleReason, setEndBattleReason] = useState('');
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
        queryKey: ['battle-problem', activeProblemId],
        queryFn: () => problemService.getProblemById(activeProblemId),
        enabled: Boolean(activeProblemId),
    });

    const clearStartFallback = useCallback(() => {
        if (startFallbackRef.current) {
            window.clearTimeout(startFallbackRef.current);
            startFallbackRef.current = null;
        }
    }, []);

    const applySnapshot = useCallback((nextSnapshot: BattleRoomSnapshot) => {
        const nextProblemIds = (nextSnapshot.problems || []).map((problem) => problem.id);
        const fallbackProblemId = nextProblemIds[0] || nextSnapshot.problemId;

        setSnapshot(nextSnapshot);
        setRoomStatus(nextSnapshot.status);
        setParticipants(nextSnapshot.participantCount);
        setConnectedParticipants(nextSnapshot.connectedParticipants);
        setLeaderboard(nextSnapshot.leaderboard || []);
        setRemainingTime(nextSnapshot.remainingTimeMs);
        setBattlePhase(getBattlePhase(nextSnapshot.status));
        setActiveProblemId((current) =>
            current && nextProblemIds.includes(current) ? current : fallbackProblemId
        );
        setCodeByProblem((current) => {
            const next: Record<string, string> = {};
            nextProblemIds.forEach((problemId) => {
                if (typeof current[problemId] === 'string') {
                    next[problemId] = current[problemId];
                }
            });
            return next;
        });
        if (nextSnapshot.status !== 'LIVE') {
            setIsSubmitting(false);
        }
    }, []);

    const endBattleMutation = useMutation({
        mutationFn: () => battleService.endRoom(roomId!, endBattleReason),
            onSuccess: (nextSnapshot) => {
                applySnapshot(nextSnapshot);
                setSocketMessage('');
                setSessionMismatchNotice('');
                setShowEndBattleModal(false);
                setEndBattleReason('');
            },
            onError: (error) => {
                const axiosError = error as AxiosError<{ message?: string }>;
                const statusCode = axiosError.response?.status;
                const message = axiosError.response?.data?.message || 'Unable to end battle.';
                if (isSessionMismatchIssue(message, statusCode)) {
                    const notice = getSessionMismatchNotice();
                    setSessionMismatchNotice(notice);
                    setSocketMessage(notice);
                } else {
                    setSocketMessage(message);
                }
            },
        });

    useEffect(() => {
        if (!roomQuery.data) {
            return;
        }
        applySnapshot(roomQuery.data);
    }, [applySnapshot, roomQuery.data]);

    useEffect(() => {
        if (!activeProblemId) {
            return;
        }

        setCodeByProblem((current) => {
            if (typeof current[activeProblemId] === 'string') {
                return current;
            }
            return {
                ...current,
                [activeProblemId]: DEFAULT_BATTLE_CODE,
            };
        });
    }, [activeProblemId]);

    useEffect(() => {
        if (!activeProblemId || !problemQuery.data?.starterCode) {
            return;
        }

        setCodeByProblem((current) => {
            const existing = current[activeProblemId];
            if (typeof existing === 'string' && existing !== DEFAULT_BATTLE_CODE) {
                return current;
            }

            return {
                ...current,
                [activeProblemId]: problemQuery.data.starterCode,
            };
        });
    }, [activeProblemId, problemQuery.data?.starterCode]);

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
                setSessionMismatchNotice('');
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
                setSessionMismatchNotice('');
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
                if (payload.reason === 'TIME_UP') {
                    setSocketMessage('Battle ended: time is up.');
                } else if (payload.reason === 'MANUAL') {
                    if (payload.teacherNote) {
                        setSocketMessage(`Battle ended by teacher: ${payload.teacherNote}`);
                    } else {
                        setSocketMessage('Battle ended by teacher.');
                    }
                }
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
                if (isSessionMismatchIssue(message, payload?.statusCode)) {
                    const notice = getSessionMismatchNotice();
                    setSessionMismatchNotice(notice);
                    setSubmitError(notice);
                    setSocketMessage(notice);
                } else {
                    setSubmitError(message);
                    setSocketMessage(message);
                }
            }),
            onManagedSocketEvent(socket, 'connect', () => {
                setIsSocketDisconnected(false);
                setSocketMessage('');
                setSessionMismatchNotice('');
                socket.emit('join_room', { roomId, userId: user.id });
                void roomQuery.refetch();
            }),
            onManagedSocketEvent(socket, 'disconnect', () => {
                setIsSocketDisconnected(true);
                setSocketMessage('Socket disconnected. Reconnecting...');
            }),
        ];

        socket.emit('join_room', { roomId, userId: user.id });

        return () => {
            socket.emit('leave_room', { roomId, userId: user.id });
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
    const currentUserScore = currentUserEntry?.score ?? 0;
    const activeCode = activeProblemId ? codeByProblem[activeProblemId] || DEFAULT_BATTLE_CODE : DEFAULT_BATTLE_CODE;

    const handleStartBattle = () => {
        if (!socket || !roomId || roomStatus !== 'WAITING') {
            return;
        }

        clearStartFallback();
        setIsStarting(true);
        setSubmitError('');
        socket.emit('start_battle', { roomId, userId: user?.id });
        startFallbackRef.current = window.setTimeout(() => {
            // Fallback to authenticated REST start in case socket auth/session is stale.
            void battleService
                .startRoom(roomId)
                .then((snapshot) => {
                    applySnapshot(snapshot);
                    setSocketMessage('');
                    setSessionMismatchNotice('');
                })
                .catch((error) => {
                    const axiosError = error as AxiosError<{ message?: string }>;
                    const statusCode = axiosError.response?.status;
                    const message = axiosError.response?.data?.message || 'Unable to start battle.';
                    if (isSessionMismatchIssue(message, statusCode)) {
                        const notice = getSessionMismatchNotice();
                        setSessionMismatchNotice(notice);
                        setSocketMessage(notice);
                    } else {
                        setSocketMessage(message);
                    }
                })
                .finally(() => {
                    setIsStarting(false);
                });
        }, 2500);
    };

    const handleEndBattle = () => {
        if (!isTeacher || roomStatus === 'ENDED' || endBattleMutation.isPending) {
            return;
        }
        setShowEndBattleModal(true);
    };

    const handleConfirmEndBattle = () => {
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
        if (!user?.id) {
            setSubmitError('Authentication state is missing. Please re-login.');
            return;
        }
        if (roomStatus !== 'LIVE') {
            setSubmitError('Battle is not live.');
            return;
        }
        if (!activeProblemId) {
            setSubmitError('Select a problem before submitting.');
            return;
        }
        if (!activeCode.trim()) {
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
            problemId: activeProblemId,
            code: activeCode,
            language,
            userId: user.id,
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
        <div className="relative isolate min-h-[calc(100vh-7.5rem)]">
            <BattleBackground />
            <div className="relative z-10 mx-auto max-w-[1500px] space-y-6 pb-6">
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
                        <Badge variant="success">Score {currentUserScore}</Badge>
                        <Badge variant="muted">Attempts {currentUserAttempts}</Badge>
                    </div>
                </div>

                {socketMessage ? (
                    <p className="rounded-xl border border-warning/35 bg-warning/15 px-3 py-2 text-sm text-warning">
                        {socketMessage}
                    </p>
                ) : null}

                {sessionMismatchNotice ? (
                    <div className="rounded-xl border border-error/35 bg-error/15 px-3 py-3 text-sm text-error">
                        <p>{sessionMismatchNotice}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => window.location.reload()}
                            >
                                Reload Tab
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/login')}
                            >
                                Login Again
                            </Button>
                        </div>
                    </div>
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
                    problems={snapshot?.problems || []}
                    activeProblemId={activeProblemId}
                    problem={problemQuery.data || null}
                    language={language}
                    code={activeCode}
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
                    onActiveProblemChange={setActiveProblemId}
                    onCodeChange={(value) => {
                        if (!activeProblemId) {
                            return;
                        }
                        setCodeByProblem((current) => ({
                            ...current,
                            [activeProblemId]: value,
                        }));
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

            <Modal
                isOpen={showEndBattleModal}
                onClose={() => {
                    if (!endBattleMutation.isPending) {
                        setShowEndBattleModal(false);
                    }
                }}
                title="End Battle Early?"
                description="This will immediately stop submissions and finalize rankings."
                maxWidthClassName="max-w-lg"
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEndBattleModal(false)}
                            disabled={endBattleMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleConfirmEndBattle}
                            disabled={endBattleMutation.isPending}
                        >
                            {endBattleMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                            {endBattleMutation.isPending ? 'Ending...' : 'End Now'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3">
                    <div className="rounded-xl border border-warning/35 bg-warning/15 px-3 py-2 text-sm text-warning">
                        Students will be moved to the result screen and timer will stop at once.
                    </div>

                    <div className="space-y-2">
                        <label className="label-base">Optional reason to show participants</label>
                        <textarea
                            value={endBattleReason}
                            onChange={(event) => setEndBattleReason(event.target.value.slice(0, 240))}
                            className="input-base min-h-[88px] resize-y"
                            placeholder="e.g. Ending due to class time over."
                            maxLength={240}
                            disabled={endBattleMutation.isPending}
                        />
                        <p className="text-xs text-muted">{endBattleReason.length}/240</p>
                    </div>
                </div>
            </Modal>
            </div>
        </div>
    );
};

export default BattleRoomPage;
