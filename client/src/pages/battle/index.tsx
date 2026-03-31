import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Copy, Loader2, Rocket, Swords, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { problemService } from '../../services/problem.service';
import { battleService } from '../../services/battle.service';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import BattleBackground from '../../components/battle/BattleBackground';

const BattleIndexPage = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

    const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
    const [durationInput, setDurationInput] = useState('30');
    const [maxParticipants, setMaxParticipants] = useState(100);
    const [roomCodeInput, setRoomCodeInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [sessionMismatchNotice, setSessionMismatchNotice] = useState('');
    const [durationValidationError, setDurationValidationError] = useState('');

    const [createdRoom, setCreatedRoom] = useState<{
        id: string;
        roomCode: string;
    } | null>(null);

    const problemsQuery = useQuery({
        queryKey: ['battle-problems', user?.id],
        queryFn: () => problemService.getAll(),
        enabled: Boolean(user && isTeacher),
    });

    const createRoomMutation = useMutation({
        mutationFn: (duration: number) =>
            battleService.createRoom({
                problemIds: selectedProblemIds,
                duration,
                maxParticipants,
            }),
        onSuccess: (room) => {
            setCreatedRoom({ id: room.id, roomCode: room.roomCode });
            setCopied(false);
            setSessionMismatchNotice('');
        },
    });

    const joinRoomMutation = useMutation({
        mutationFn: (roomCode: string) => battleService.joinRoom(roomCode),
        onSuccess: (room) => {
            setSessionMismatchNotice('');
            navigate(`/app/battle/${room.id}`);
        },
    });

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

    useEffect(() => {
        const mutationError = (createRoomMutation.error || joinRoomMutation.error) as
            | AxiosError<{ message?: string }>
            | null;
        const message = mutationError?.response?.data?.message || mutationError?.message || '';
        const statusCode = mutationError?.response?.status;

        if (isSessionMismatchIssue(message, statusCode)) {
            setSessionMismatchNotice('Session mismatch detected in this tab. Reload the tab or login again.');
        } else {
            setSessionMismatchNotice('');
        }
    }, [createRoomMutation.error, joinRoomMutation.error]);

    const formError = useMemo(() => {
        const mutationError = (createRoomMutation.error || joinRoomMutation.error) as
            | AxiosError<{ message?: string }>
            | null;
        return mutationError?.response?.data?.message || mutationError?.message || '';
    }, [createRoomMutation.error, joinRoomMutation.error]);

    const parsedDuration = Number.parseInt(durationInput, 10);
    const isDurationValid = Number.isInteger(parsedDuration) && parsedDuration >= 5 && parsedDuration <= 180;

    const toggleProblemSelection = (problemId: string) => {
        setSelectedProblemIds((current) =>
            current.includes(problemId)
                ? current.filter((id) => id !== problemId)
                : [...current, problemId]
        );
    };

    const handleCreateRoom = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createRoomMutation.reset();
        setDurationValidationError('');
        if (selectedProblemIds.length === 0) {
            return;
        }
        if (!isDurationValid) {
            setDurationValidationError('Duration must be between 5 and 180 minutes.');
            return;
        }
        createRoomMutation.mutate(parsedDuration);
    };

    const handleJoinRoom = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        joinRoomMutation.reset();
        const normalizedCode = roomCodeInput.trim().toUpperCase();
        if (!normalizedCode) {
            return;
        }
        joinRoomMutation.mutate(normalizedCode);
    };

    const copyRoomCode = async () => {
        if (!createdRoom?.roomCode) {
            return;
        }

        try {
            await navigator.clipboard.writeText(createdRoom.roomCode);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        } catch {
            setCopied(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex h-[65vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary-cyan" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="relative isolate min-h-[calc(100vh-7.5rem)]">
            <BattleBackground />
            <div className="relative z-10 mx-auto max-w-6xl space-y-6 pb-6">
            <div className="space-y-2">
                <h1 className="typ-h1 !mb-0">Competitive Battle Mode</h1>
                <p className="typ-muted">Real-time coding battles with synced timer and live leaderboard updates.</p>
            </div>

            {durationValidationError || formError ? (
                <div className="rounded-xl border border-error/35 bg-error/15 px-4 py-3 text-sm font-medium text-error">
                    {durationValidationError || formError}
                </div>
            ) : null}

            {sessionMismatchNotice ? (
                <div className="rounded-xl border border-error/35 bg-error/15 px-4 py-3 text-sm text-error">
                    <p>{sessionMismatchNotice}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                            Reload Tab
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                            Login Again
                        </Button>
                    </div>
                </div>
            ) : null}

            {isTeacher ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <Card variant="glass">
                        <form className="space-y-4" onSubmit={handleCreateRoom}>
                            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-blue/20 text-primary-cyan">
                                <Swords size={22} />
                            </div>

                            <div>
                                <h2 className="typ-h2 !mb-1 !text-2xl">Create Battle Room</h2>
                                <p className="typ-muted">Pick problem setup and launch a timed coding battle.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="label-base">Problems</label>
                                <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border bg-card/70 p-3">
                                    {(problemsQuery.data || []).map((problem) => {
                                        const isSelected = selectedProblemIds.includes(problem.id);
                                        const selectedOrder = selectedProblemIds.indexOf(problem.id) + 1;

                                        return (
                                            <button
                                                key={problem.id}
                                                type="button"
                                                onClick={() => toggleProblemSelection(problem.id)}
                                                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                                                    isSelected
                                                        ? 'border-primary-blue/55 bg-primary-blue/20'
                                                        : 'border-border bg-surface hover:border-primary-blue/45'
                                                }`}
                                                disabled={createRoomMutation.isPending}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-medium text-gray-700">{problem.title}</p>
                                                        <p className="text-xs text-muted">{problem.difficulty}</p>
                                                    </div>
                                                    {isSelected ? (
                                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-blue/25 text-xs font-semibold text-primary-cyan">
                                                            {selectedOrder}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {problemsQuery.isLoading ? (
                                        <p className="text-sm text-muted">Loading problems...</p>
                                    ) : null}
                                    {!problemsQuery.isLoading && (problemsQuery.data || []).length === 0 ? (
                                        <p className="text-sm text-muted">No problems available.</p>
                                    ) : null}
                                </div>
                                <p className="text-xs text-muted">
                                    Select one or more problems. Students solve them in sequence.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="label-base">Duration (minutes)</label>
                                    <div className="flex items-center gap-2">
                                        {[15, 30, 60].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => {
                                                    setDurationInput(String(preset));
                                                    setDurationValidationError('');
                                                }}
                                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                                                    durationInput === String(preset)
                                                        ? 'border-primary-blue/55 bg-primary-blue/20 text-primary-cyan'
                                                        : 'border-border bg-surface text-muted hover:text-gray-700'
                                                }`}
                                                disabled={createRoomMutation.isPending}
                                            >
                                                {preset}m
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        min={5}
                                        max={180}
                                        step={1}
                                        value={durationInput}
                                        onChange={(event) => {
                                            setDurationInput(event.target.value);
                                            setDurationValidationError('');
                                        }}
                                        className="input-base"
                                        disabled={createRoomMutation.isPending}
                                    />
                                    <p className="text-xs text-muted">Allowed range: 5 to 180 minutes.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="label-base">Max Participants</label>
                                    <input
                                        type="number"
                                        min={2}
                                        max={500}
                                        value={maxParticipants}
                                        onChange={(event) => setMaxParticipants(Number(event.target.value))}
                                        className="input-base"
                                        disabled={createRoomMutation.isPending}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                className="!from-primary-cyan !via-primary-blue !to-primary-blue"
                                fullWidth
                                disabled={selectedProblemIds.length === 0 || createRoomMutation.isPending || !isDurationValid}
                            >
                                {createRoomMutation.isPending ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Rocket size={16} />
                                )}
                                {createRoomMutation.isPending ? 'Creating room...' : 'Create Room'}
                            </Button>
                        </form>
                    </Card>

                    <Card variant="layered" className="space-y-4">
                        <div className="inline-flex items-center gap-2">
                            <Users size={18} className="text-primary-cyan" />
                            <h3 className="typ-h3 !mb-0 !text-xl">Room Access</h3>
                        </div>

                        {createdRoom ? (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-border bg-card/75 p-4">
                                    <p className="text-xs uppercase tracking-wide text-muted">Room Code</p>
                                    <p className="mt-1 text-3xl font-bold tracking-[0.22em] text-primary-cyan">
                                        {createdRoom.roomCode}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={copyRoomCode}>
                                        <Copy size={16} />
                                        {copied ? 'Copied' : 'Copy Code'}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="!from-primary-cyan !via-primary-blue !to-primary-blue"
                                        onClick={() => navigate(`/app/battle/${createdRoom.id}`)}
                                    >
                                        Open Room
                                    </Button>
                                </div>

                                <Badge variant="primary">Share this code with students to join.</Badge>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border bg-card/75 p-4 text-sm text-muted">
                                Your generated room code will appear here.
                            </div>
                        )}
                    </Card>
                </div>
            ) : (
                <Card variant="glass" className="mx-auto max-w-xl">
                    <form className="space-y-4" onSubmit={handleJoinRoom}>
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-blue/20 text-primary-cyan">
                            <Swords size={22} />
                        </div>

                        <div>
                            <h2 className="typ-h2 !mb-1 !text-2xl">Join Battle Room</h2>
                            <p className="typ-muted">Enter the 6-character room code shared by your teacher.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="label-base">Room Code</label>
                            <input
                                value={roomCodeInput}
                                onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
                                maxLength={6}
                                placeholder="ABC123"
                                className="input-base tracking-[0.2em] uppercase"
                                disabled={joinRoomMutation.isPending}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="!from-primary-cyan !via-primary-blue !to-primary-blue"
                            fullWidth
                            disabled={!roomCodeInput.trim() || joinRoomMutation.isPending}
                        >
                            {joinRoomMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                            {joinRoomMutation.isPending ? 'Joining...' : 'Join Battle'}
                        </Button>
                    </form>
                </Card>
            )}
            </div>
        </div>
    );
};

export default BattleIndexPage;
