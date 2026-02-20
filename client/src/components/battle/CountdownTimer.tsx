import { useEffect, useMemo, useRef, useState } from 'react';
import type { BattleRoomStatus } from '../../services/battle.service';

interface CountdownTimerProps {
    remainingTimeMs: number;
    serverTimeIso?: string | null;
    status: BattleRoomStatus;
    onElapsed?: () => void;
}

const TICK_INTERVAL_MS = 250;
const WARNING_THRESHOLD_MS = 10_000;

interface AnchorState {
    baselineRemainingMs: number;
    clientTimeMs: number;
}

const formatClock = (valueMs: number) => {
    const totalSeconds = Math.max(0, Math.floor(valueMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const CountdownTimer = ({ remainingTimeMs, serverTimeIso, status, onElapsed }: CountdownTimerProps) => {
    const [displayTimeMs, setDisplayTimeMs] = useState(Math.max(0, remainingTimeMs));
    const elapsedSignalRef = useRef(false);
    const anchorRef = useRef<AnchorState>({
        baselineRemainingMs: Math.max(0, remainingTimeMs),
        clientTimeMs: Date.now(),
    });

    useEffect(() => {
        const clientNow = Date.now();
        const serverTimeMs = serverTimeIso ? new Date(serverTimeIso).getTime() : clientNow;
        const networkDelayMs = Number.isNaN(serverTimeMs) ? 0 : Math.max(0, clientNow - serverTimeMs);
        const correctedRemainingMs = Math.max(0, remainingTimeMs - networkDelayMs);

        anchorRef.current = {
            baselineRemainingMs: correctedRemainingMs,
            clientTimeMs: clientNow,
        };
        setDisplayTimeMs(correctedRemainingMs);

        if (correctedRemainingMs > 0) {
            elapsedSignalRef.current = false;
        }
    }, [remainingTimeMs, serverTimeIso]);

    useEffect(() => {
        if (status !== 'LIVE') {
            setDisplayTimeMs(Math.max(0, remainingTimeMs));
            return;
        }

        const intervalId = window.setInterval(() => {
            const elapsed = Date.now() - anchorRef.current.clientTimeMs;
            const nextMs = Math.max(0, anchorRef.current.baselineRemainingMs - elapsed);
            setDisplayTimeMs(nextMs);
        }, TICK_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [remainingTimeMs, status]);

    useEffect(() => {
        if (displayTimeMs > 0 || status !== 'LIVE' || !onElapsed || elapsedSignalRef.current) {
            return;
        }

        elapsedSignalRef.current = true;
        onElapsed();
    }, [displayTimeMs, onElapsed, status]);

    const isCritical = status === 'LIVE' && displayTimeMs <= WARNING_THRESHOLD_MS;
    const timerClasses = useMemo(
        () => `text-3xl font-bold tabular-nums ${isCritical ? 'animate-pulse text-error' : 'text-primary-cyan'}`,
        [isCritical]
    );

    return (
        <div className="rounded-xl border border-border bg-card/90 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Time Remaining</p>
            <p className={timerClasses}>{formatClock(displayTimeMs)}</p>
            <p className="mt-1 text-xs text-muted">
                {status === 'ENDED' ? 'Battle finished' : status === 'WAITING' ? 'Waiting for start' : 'Synced with server'}
            </p>
        </div>
    );
};

export default CountdownTimer;
