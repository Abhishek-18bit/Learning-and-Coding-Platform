import { useMemo, useState } from 'react';
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

const BattleIndexPage = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

    const [problemId, setProblemId] = useState('');
    const [duration, setDuration] = useState<15 | 30 | 60>(30);
    const [maxParticipants, setMaxParticipants] = useState(100);
    const [roomCodeInput, setRoomCodeInput] = useState('');
    const [copied, setCopied] = useState(false);

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
        mutationFn: () =>
            battleService.createRoom({
                problemId,
                duration,
                maxParticipants,
            }),
        onSuccess: (room) => {
            setCreatedRoom({ id: room.id, roomCode: room.roomCode });
            setCopied(false);
        },
    });

    const joinRoomMutation = useMutation({
        mutationFn: (roomCode: string) => battleService.joinRoom(roomCode),
        onSuccess: (room) => {
            navigate(`/app/battle/${room.id}`);
        },
    });

    const formError = useMemo(() => {
        const mutationError = (createRoomMutation.error || joinRoomMutation.error) as
            | AxiosError<{ message?: string }>
            | null;
        return mutationError?.response?.data?.message || mutationError?.message || '';
    }, [createRoomMutation.error, joinRoomMutation.error]);

    const handleCreateRoom = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createRoomMutation.reset();
        if (!problemId) {
            return;
        }
        createRoomMutation.mutate();
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
        } catch (_error) {
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
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="space-y-2">
                <h1 className="typ-h1 !mb-0">Competitive Battle Mode</h1>
                <p className="typ-muted">Real-time coding battles with synced timer and live leaderboard updates.</p>
            </div>

            {formError ? (
                <div className="rounded-xl border border-error/35 bg-error/15 px-4 py-3 text-sm font-medium text-error">
                    {formError}
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
                                <label className="label-base">Problem</label>
                                <select
                                    value={problemId}
                                    onChange={(event) => setProblemId(event.target.value)}
                                    className="input-base"
                                    disabled={problemsQuery.isLoading || createRoomMutation.isPending}
                                >
                                    <option value="">Select problem</option>
                                    {(problemsQuery.data || []).map((problem) => (
                                        <option key={problem.id} value={problem.id}>
                                            {problem.title} ({problem.difficulty})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="label-base">Duration</label>
                                    <select
                                        value={duration}
                                        onChange={(event) => setDuration(Number(event.target.value) as 15 | 30 | 60)}
                                        className="input-base"
                                        disabled={createRoomMutation.isPending}
                                    >
                                        <option value={15}>15 minutes</option>
                                        <option value={30}>30 minutes</option>
                                        <option value={60}>60 minutes</option>
                                    </select>
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
                                disabled={!problemId || createRoomMutation.isPending}
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
    );
};

export default BattleIndexPage;
