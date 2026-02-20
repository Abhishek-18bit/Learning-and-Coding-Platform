import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Loader2, MessageSquare, SendHorizontal } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../providers/SocketProvider';
import { onManagedSocketEvent } from '../../lib/socket';
import { chatService, type ChatContextType, type ChatMessage } from '../../services/chat.service';

interface ContextChatPanelProps {
    contextType: ChatContextType;
    contextId?: string;
    title?: string;
    subtitle?: string;
    className?: string;
}

interface ChatJoinedEvent {
    contextType: string;
    contextId: string;
    channel: {
        id: string;
    };
}

interface ChatMessageEvent {
    contextType: string;
    contextId: string;
    channelId: string;
    message: ChatMessage;
}

const PAGE_LIMIT = 30;

const mergeClassNames = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(' ');

const appendIfMissing = (rows: ChatMessage[], nextMessage: ChatMessage) => {
    if (rows.some((row) => row.id === nextMessage.id)) {
        return rows;
    }
    return [...rows, nextMessage];
};

const prependUnique = (existing: ChatMessage[], incoming: ChatMessage[]) => {
    const existingIds = new Set(existing.map((row) => row.id));
    const uniqueIncoming = incoming.filter((row) => !existingIds.has(row.id));
    return [...uniqueIncoming, ...existing];
};

const extractErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
        return error.response?.data?.message || fallback;
    }
    return fallback;
};

const formatMessageTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ContextChatPanel = ({
    contextType,
    contextId,
    title = 'Discussion',
    subtitle = 'Realtime context chat',
    className,
}: ContextChatPanelProps) => {
    const { user } = useAuth();
    const { socket, connected } = useSocket();

    const normalizedContextType = useMemo(() => contextType.toUpperCase() as ChatContextType, [contextType]);

    const [channelId, setChannelId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [isCodeMode, setIsCodeMode] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [panelError, setPanelError] = useState('');

    const listRef = useRef<HTMLDivElement | null>(null);
    const channelIdRef = useRef<string | null>(null);
    const suppressAutoScrollRef = useRef(false);
    const lastMarkedMessageRef = useRef<string | null>(null);

    const contextQuery = useQuery({
        queryKey: ['chat-context', normalizedContextType, contextId],
        queryFn: () => chatService.getContextMessages(normalizedContextType, contextId as string, { limit: PAGE_LIMIT }),
        enabled: Boolean(contextId),
    });

    useEffect(() => {
        channelIdRef.current = channelId;
    }, [channelId]);

    useEffect(() => {
        if (!contextQuery.data) {
            return;
        }

        setChannelId(contextQuery.data.channel.id);
        setMessages(contextQuery.data.messages);
        setNextCursor(contextQuery.data.nextCursor);
        lastMarkedMessageRef.current = contextQuery.data.readState.lastReadMessageId;
        setPanelError('');
    }, [contextQuery.data]);

    useEffect(() => {
        if (!messages.length) {
            return;
        }
        if (suppressAutoScrollRef.current) {
            suppressAutoScrollRef.current = false;
            return;
        }
        const list = listRef.current;
        if (!list) {
            return;
        }
        list.scrollTop = list.scrollHeight;
    }, [messages.length]);

    const sendMutation = useMutation({
        mutationFn: (payload: { content: string; type: 'TEXT' | 'CODE' }) =>
            chatService.sendMessage(normalizedContextType, contextId as string, payload),
        onSuccess: (result) => {
            setChannelId(result.channel.id);
            setMessages((previous) => appendIfMissing(previous, result.message));
            setDraft('');
            setPanelError('');
        },
        onError: (error) => {
            setPanelError(extractErrorMessage(error, 'Failed to send message.'));
        },
    });

    const sendCurrentMessage = () => {
        const content = draft.trim();
        if (!content || !contextId) {
            return;
        }

        sendMutation.mutate({
            content,
            type: isCodeMode ? 'CODE' : 'TEXT',
        });
    };

    const loadOlderMessages = async () => {
        if (!contextId || !nextCursor || loadingOlder) {
            return;
        }

        setLoadingOlder(true);
        try {
            const response = await chatService.getContextMessages(normalizedContextType, contextId, {
                limit: PAGE_LIMIT,
                cursor: nextCursor,
            });
            suppressAutoScrollRef.current = true;
            setMessages((existing) => prependUnique(existing, response.messages));
            setNextCursor(response.nextCursor);
            setPanelError('');
        } catch (error) {
            setPanelError(extractErrorMessage(error, 'Failed to load older messages.'));
        } finally {
            setLoadingOlder(false);
        }
    };

    useEffect(() => {
        if (!socket || !contextId || !user) {
            return;
        }

        const unsubs = [
            onManagedSocketEvent(socket, 'chat_joined', (payload: ChatJoinedEvent) => {
                if (
                    !payload ||
                    payload.contextType !== normalizedContextType ||
                    payload.contextId !== contextId
                ) {
                    return;
                }
                setChannelId(payload.channel.id);
                setPanelError('');
            }),
            onManagedSocketEvent(socket, 'chat_message', (payload: ChatMessageEvent) => {
                if (
                    !payload ||
                    payload.contextType !== normalizedContextType ||
                    payload.contextId !== contextId
                ) {
                    return;
                }

                setChannelId(payload.channelId);
                setMessages((existing) => appendIfMissing(existing, payload.message));
            }),
            onManagedSocketEvent(socket, 'chat_error', (payload: { message?: string }) => {
                setPanelError(payload?.message || 'Chat connection error.');
            }),
            onManagedSocketEvent(socket, 'connect', () => {
                socket.emit('join_chat', {
                    contextType: normalizedContextType,
                    contextId,
                });
            }),
        ];

        socket.emit('join_chat', {
            contextType: normalizedContextType,
            contextId,
        });

        return () => {
            if (channelIdRef.current) {
                socket.emit('leave_chat', { channelId: channelIdRef.current });
            }
            unsubs.forEach((unsubscribe) => unsubscribe());
        };
    }, [contextId, normalizedContextType, socket, user]);

    useEffect(() => {
        if (!contextId || !messages.length) {
            return;
        }

        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMarkedMessageRef.current === lastMessage.id) {
            return;
        }

        const timeout = window.setTimeout(() => {
            void chatService
                .markRead(normalizedContextType, contextId, lastMessage.id)
                .then((readState) => {
                    lastMarkedMessageRef.current = readState.lastReadMessageId;
                })
                .catch(() => undefined);

            if (socket && connected) {
                socket.emit('mark_chat_read', {
                    contextType: normalizedContextType,
                    contextId,
                    messageId: lastMessage.id,
                });
            }
        }, 650);

        return () => window.clearTimeout(timeout);
    }, [connected, contextId, messages, normalizedContextType, socket]);

    if (!contextId) {
        return null;
    }

    const queryError = contextQuery.isError
        ? extractErrorMessage(contextQuery.error, 'Unable to load chat')
        : '';

    return (
        <Card
            variant="glass"
            className={mergeClassNames('flex min-h-[320px] flex-col gap-3', className)}
        >
            <header className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="typ-h3 !mb-0 !text-lg inline-flex items-center gap-2">
                        <MessageSquare size={16} />
                        {title}
                    </h3>
                    <p className="typ-muted">{subtitle}</p>
                </div>
                <Badge variant={connected ? 'success' : 'warning'}>
                    {connected ? 'Live' : 'Offline'}
                </Badge>
            </header>

            {(queryError || panelError) ? (
                <p className="rounded-lg border border-error/40 bg-error/15 px-3 py-2 text-sm text-error">
                    {queryError || panelError}
                </p>
            ) : null}

            <div
                ref={listRef}
                className="min-h-[180px] flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-card/50 p-3"
            >
                {nextCursor ? (
                    <div className="flex justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadOlderMessages}
                            disabled={loadingOlder}
                            className="text-xs"
                        >
                            {loadingOlder ? <Loader2 size={14} className="animate-spin" /> : null}
                            {loadingOlder ? 'Loading...' : 'Load older'}
                        </Button>
                    </div>
                ) : null}

                {contextQuery.isLoading ? (
                    <div className="flex h-full items-center justify-center py-8 text-sm text-muted">
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Loading chat...
                    </div>
                ) : null}

                {!contextQuery.isLoading && messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted">
                        No messages yet. Start the discussion.
                    </p>
                ) : null}

                {messages.map((message) => {
                    const isMine = message.sender.id === user?.id;
                    return (
                        <article
                            key={message.id}
                            className={mergeClassNames(
                                'max-w-[92%] rounded-xl border px-3 py-2',
                                isMine
                                    ? 'ml-auto border-primary-blue/45 bg-primary-blue/18'
                                    : 'mr-auto border-border bg-surface'
                            )}
                        >
                            <div className="mb-1 flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-700">
                                    {isMine ? 'You' : message.sender.name}
                                </span>
                                <span className="text-[11px] text-muted">
                                    {formatMessageTime(message.createdAt)}
                                </span>
                            </div>

                            {message.type === 'CODE' ? (
                                <pre className="typ-code !m-0 !border-0 !bg-transparent !p-0 whitespace-pre-wrap">
                                    {message.content}
                                </pre>
                            ) : (
                                <p className="!m-0 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                    {message.content}
                                </p>
                            )}
                        </article>
                    );
                })}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setIsCodeMode((value) => !value)}
                        className={mergeClassNames(
                            'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors dur-fast',
                            isCodeMode
                                ? 'border-primary-blue/50 bg-primary-blue/20 text-primary-cyan'
                                : 'border-border bg-surface text-muted'
                        )}
                    >
                        {isCodeMode ? 'Code mode' : 'Text mode'}
                    </button>
                    <span className="text-xs text-muted">{draft.trim().length}/2000</span>
                </div>

                <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            sendCurrentMessage();
                        }
                    }}
                    className="input-base min-h-[78px] resize-y text-sm leading-6"
                    placeholder={isCodeMode ? 'Share a code snippet...' : 'Write a message...'}
                    maxLength={2000}
                />

                <div className="flex justify-end">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={sendCurrentMessage}
                        disabled={sendMutation.isPending || !draft.trim()}
                        className="!from-primary-cyan !via-primary-blue !to-primary-blue"
                    >
                        {sendMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <SendHorizontal size={15} />}
                        {sendMutation.isPending ? 'Sending...' : 'Send'}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default ContextChatPanel;
