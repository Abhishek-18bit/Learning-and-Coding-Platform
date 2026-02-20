import { useEffect, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Loader2, Send, Signal, Timer } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import CountdownTimer from './CountdownTimer';
import LiveLeaderboard from './LiveLeaderboard';
import type { Problem } from '../../services/problem.service';
import type {
    BattleLeaderboardEntry,
    BattleRoomStatus,
    BattleSubmissionSummary,
} from '../../services/battle.service';
import ContextChatPanel from '../chat/ContextChatPanel';

interface BattleRoomProps {
    roomId: string;
    status: BattleRoomStatus;
    problem: Problem | null;
    language: string;
    code: string;
    canSubmit: boolean;
    isSubmitting: boolean;
    participantCount: number;
    connectedParticipants: number;
    leaderboard: BattleLeaderboardEntry[];
    currentUserId?: string;
    remainingTimeMs: number;
    timerServerTimeIso?: string | null;
    submitSummary: BattleSubmissionSummary | null;
    submitError: string;
    onLanguageChange: (language: string) => void;
    onCodeChange: (code: string) => void;
    onSubmit: () => void;
    onTimerElapsed: () => void;
}

const BattleRoom = ({
    roomId,
    status,
    problem,
    language,
    code,
    canSubmit,
    isSubmitting,
    participantCount,
    connectedParticipants,
    leaderboard,
    currentUserId,
    remainingTimeMs,
    timerServerTimeIso,
    submitSummary,
    submitError,
    onLanguageChange,
    onCodeChange,
    onSubmit,
    onTimerElapsed,
}: BattleRoomProps) => {
    const isEnded = status === 'ENDED';
    const isLive = status === 'LIVE';
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
    const editorContainerRef = useRef<HTMLDivElement | null>(null);
    const [editorReady, setEditorReady] = useState(false);
    const [fallbackEditorEnabled, setFallbackEditorEnabled] = useState(false);

    useEffect(() => {
        if (editorReady) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setFallbackEditorEnabled(true);
        }, 2000);

        return () => window.clearTimeout(timeoutId);
    }, [editorReady]);

    useEffect(() => {
        if (!editorContainerRef.current) {
            return;
        }

        const observer = new ResizeObserver(() => {
            editorRef.current?.layout();
        });

        observer.observe(editorContainerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        window.requestAnimationFrame(() => {
            editorRef.current?.layout();
            if (!isEnded) {
                editorRef.current?.focus();
            }
        });
    }, [isEnded, status]);

    const handleEditorMount: OnMount = (editorInstance) => {
        editorRef.current = editorInstance;
        setEditorReady(true);
        setFallbackEditorEnabled(false);

        window.requestAnimationFrame(() => {
            editorInstance.layout();
            if (!isEnded) {
                editorInstance.focus();
            }
        });
    };

    return (
        <div className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="flex min-h-0 flex-col gap-4">
                <Card variant="glass" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="typ-h2 !mb-1 !text-2xl">{problem?.title || 'Battle Problem'}</h2>
                            <p className="typ-muted">Live coding challenge is active. Submit against hidden and visible tests.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={isLive ? 'success' : 'error'}>{status}</Badge>
                            <Badge variant="muted">
                                <Signal size={12} />
                                {connectedParticipants}/{participantCount}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-border bg-card/70 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted">Difficulty</p>
                            <p className="font-semibold text-gray-800">{problem?.difficulty || '--'}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card/70 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted">Input</p>
                            <p className="line-clamp-2 text-sm text-gray-700">{problem?.inputFormat || '--'}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card/70 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted">Output</p>
                            <p className="line-clamp-2 text-sm text-gray-700">{problem?.outputFormat || '--'}</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card/70 p-4">
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Problem Statement</h3>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {problem?.description || 'Problem details are loading.'}
                        </p>
                        {problem?.constraints ? (
                            <div className="mt-3 border-t border-border/80 pt-3">
                                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Constraints</h4>
                                <p className="whitespace-pre-wrap text-sm text-gray-700">{problem.constraints}</p>
                            </div>
                        ) : null}
                    </div>
                </Card>

                <Card variant="layered" tilt={false} className="!p-0 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                            <Timer size={14} />
                            Battle Editor
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={language}
                                onChange={(event) => onLanguageChange(event.target.value)}
                                className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-gray-700"
                                disabled={isSubmitting || isEnded}
                            >
                                <option value="javascript">JavaScript</option>
                            </select>

                            <Button
                                variant="primary"
                                size="sm"
                                className="!from-primary-cyan !via-primary-blue !to-primary-blue"
                                onClick={onSubmit}
                                disabled={!canSubmit || !isLive || isSubmitting || isEnded}
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {isSubmitting ? 'Submitting...' : 'Submit Attempt'}
                            </Button>
                        </div>
                    </div>

                    <div ref={editorContainerRef} className="h-[420px] min-h-[360px] bg-background">
                        {fallbackEditorEnabled ? (
                            <textarea
                                value={code}
                                onChange={(event) => onCodeChange(event.target.value)}
                                readOnly={isEnded}
                                className="h-full w-full resize-none border-0 bg-background p-4 font-code text-sm leading-6 text-gray-100 focus:outline-none"
                                spellCheck={false}
                            />
                        ) : (
                            <Editor
                                height="100%"
                                language="javascript"
                                value={code}
                                onMount={handleEditorMount}
                                onChange={(value) => onCodeChange(value || '')}
                                loading={
                                    <div className="flex h-full items-center justify-center text-sm text-muted">
                                        Loading editor...
                                    </div>
                                }
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    automaticLayout: true,
                                    lineNumbers: 'on',
                                    fontSize: 14,
                                    scrollBeyondLastLine: false,
                                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                                    padding: { top: 10, bottom: 12 },
                                    readOnly: isEnded,
                                }}
                            />
                        )}
                    </div>
                </Card>

                <Card variant="glass" className="space-y-3">
                    <h3 className="typ-h3 !mb-0 !text-lg">Last Submission</h3>
                    {submitError ? (
                        <p className="rounded-xl border border-error/40 bg-error/15 px-3 py-2 text-sm font-medium text-error">
                            {submitError}
                        </p>
                    ) : null}

                    {submitSummary ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-border bg-card/70 p-3">
                                <p className="text-xs uppercase tracking-wide text-muted">Verdict</p>
                                <p className="text-lg font-semibold text-gray-900">{submitSummary.finalVerdict}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-card/70 p-3">
                                <p className="text-xs uppercase tracking-wide text-muted">Passed</p>
                                <p className="text-lg font-semibold text-gray-900">{submitSummary.passedTestCount}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-card/70 p-3">
                                <p className="text-xs uppercase tracking-wide text-muted">Execution</p>
                                <p className="text-lg font-semibold text-gray-900">{submitSummary.executionTime} ms</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted">No attempts yet. Submit code to receive verdict and ranking updates.</p>
                    )}
                </Card>
            </div>

            <div className="flex min-h-0 flex-col gap-4">
                <CountdownTimer
                    remainingTimeMs={remainingTimeMs}
                    serverTimeIso={timerServerTimeIso}
                    status={status}
                    onElapsed={onTimerElapsed}
                />

                <div className="min-h-0 flex-1">
                    <LiveLeaderboard
                        entries={leaderboard}
                        currentUserId={currentUserId}
                        isEnded={isEnded}
                        participantCount={participantCount}
                        connectedParticipants={connectedParticipants}
                    />
                </div>

                <ContextChatPanel
                    contextType="BATTLE"
                    contextId={roomId}
                    title="Battle Chat"
                    subtitle="Live discussion during the battle."
                    className="min-h-[300px]"
                />
            </div>
        </div>
    );
};

export default BattleRoom;
