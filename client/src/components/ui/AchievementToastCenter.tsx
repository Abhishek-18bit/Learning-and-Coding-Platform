import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useSocket } from '../../providers/SocketProvider';
import { onManagedSocketEvent } from '../../lib/socket';
import { resolveAchievementIcon } from '../../utils/achievementIcons';

interface BadgeUnlockedPayload {
    code?: string;
    title?: string;
    description?: string;
    icon?: string | null;
    category?: string;
    earnedAt?: string;
}

interface BadgeToastItem {
    id: string;
    code: string;
    title: string;
    description: string;
    icon: string | null;
    category: string;
    earnedAt: string;
}

const AUTO_DISMISS_MS = 5200;
const MAX_VISIBLE_TOASTS = 3;

const AchievementToastCenter = () => {
    const { socket } = useSocket();
    const [toasts, setToasts] = useState<BadgeToastItem[]>([]);
    const timerByIdRef = useRef<Map<string, number>>(new Map());

    const dismissToast = useCallback((id: string) => {
        const timeoutId = timerByIdRef.current.get(id);
        if (typeof timeoutId === 'number') {
            window.clearTimeout(timeoutId);
            timerByIdRef.current.delete(id);
        }

        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    useEffect(() => {
        if (!socket) {
            return;
        }

        const unsubscribe = onManagedSocketEvent(socket, 'BADGE_UNLOCKED', (payload: BadgeUnlockedPayload) => {
            if (!payload || typeof payload.title !== 'string' || !payload.title.trim()) {
                return;
            }

            const badgeCode = typeof payload.code === 'string' && payload.code.trim()
                ? payload.code.trim()
                : `badge-${Date.now()}`;
            const toastId = `${badgeCode}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const toast: BadgeToastItem = {
                id: toastId,
                code: badgeCode,
                title: payload.title.trim(),
                description:
                    typeof payload.description === 'string' && payload.description.trim()
                        ? payload.description.trim()
                        : 'New achievement unlocked.',
                icon: typeof payload.icon === 'string' ? payload.icon : null,
                category:
                    typeof payload.category === 'string' && payload.category.trim()
                        ? payload.category.trim()
                        : 'ACHIEVEMENT',
                earnedAt:
                    typeof payload.earnedAt === 'string' && payload.earnedAt.trim()
                        ? payload.earnedAt
                        : new Date().toISOString(),
            };

            setToasts((current) => {
                const deduped = current.filter((entry) => entry.code !== toast.code);
                return [toast, ...deduped].slice(0, MAX_VISIBLE_TOASTS);
            });

            const timeoutId = window.setTimeout(() => {
                dismissToast(toastId);
            }, AUTO_DISMISS_MS);

            timerByIdRef.current.set(toastId, timeoutId);
        });

        return () => {
            unsubscribe();
        };
    }, [dismissToast, socket]);

    useEffect(() => () => {
        timerByIdRef.current.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        timerByIdRef.current.clear();
    }, []);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed right-4 top-24 z-[140] flex w-[min(92vw,24rem)] flex-col gap-3">
            {toasts.map((toast) => {
                const Icon = resolveAchievementIcon(toast.icon);
                return (
                    <div
                        key={toast.id}
                        className="notification-slide-in pointer-events-auto rounded-xl border border-primary-blue/45 bg-card/95 p-4 shadow-medium backdrop-blur-md"
                    >
                        <div className="flex items-start gap-3">
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary-cyan/35 bg-primary-blue/20 text-primary-cyan">
                                <Icon size={18} />
                            </span>

                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-cyan">
                                    Badge Unlocked
                                </p>
                                <h4 className="mt-0.5 text-base font-semibold text-gray-900">{toast.title}</h4>
                                <p className="mt-1 text-sm text-muted">{toast.description}</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => dismissToast(toast.id)}
                                className="rounded-md border border-border bg-surface p-1 text-muted hover:text-gray-700"
                                aria-label="Dismiss badge notification"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
                            <span className="truncate">{toast.category.replace('_', ' ')}</span>
                            <span className="shrink-0">
                                {new Date(toast.earnedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AchievementToastCenter;
