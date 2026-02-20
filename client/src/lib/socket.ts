import { io, Socket } from 'socket.io-client';

type GenericSocketHandler = (...args: any[]) => void;

const LISTENER_REGISTRY = new WeakMap<Socket, Map<string, Set<GenericSocketHandler>>>();

let socketInstance: Socket | null = null;
let currentToken: string | null = null;

const stripApiSuffix = (value: string) => value.replace(/\/api\/?$/i, '');

const resolveSocketUrl = () => {
    const configured = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const normalized = stripApiSuffix(configured);

    try {
        const parsed = new URL(normalized);
        const pathname = parsed.pathname.endsWith('/')
            ? parsed.pathname.slice(0, -1)
            : parsed.pathname;

        if (!pathname || pathname === '/') {
            return parsed.origin;
        }

        return `${parsed.origin}${pathname}`;
    } catch (_error) {
        return normalized;
    }
};

const getListenerSet = (socket: Socket, event: string) => {
    let eventMap = LISTENER_REGISTRY.get(socket);
    if (!eventMap) {
        eventMap = new Map<string, Set<GenericSocketHandler>>();
        LISTENER_REGISTRY.set(socket, eventMap);
    }

    let listeners = eventMap.get(event);
    if (!listeners) {
        listeners = new Set<GenericSocketHandler>();
        eventMap.set(event, listeners);
    }

    return listeners;
};

export const connectSocket = (token: string) => {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
        return null;
    }

    if (socketInstance && currentToken === normalizedToken) {
        return socketInstance;
    }

    if (socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
    }

    socketInstance = io(resolveSocketUrl(), {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 800,
        reconnectionDelayMax: 5000,
        timeout: 15000,
        autoConnect: true,
        auth: {
            token: `Bearer ${normalizedToken}`,
        },
    });
    currentToken = normalizedToken;
    return socketInstance;
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
    if (!socketInstance) {
        return;
    }

    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    LISTENER_REGISTRY.delete(socketInstance);
    socketInstance = null;
    currentToken = null;
};

export const onManagedSocketEvent = <THandler extends GenericSocketHandler>(
    socket: Socket,
    event: string,
    handler: THandler
) => {
    const listeners = getListenerSet(socket, event);
    if (listeners.has(handler)) {
        return () => {
            listeners.delete(handler);
            socket.off(event, handler);
        };
    }

    listeners.add(handler);
    socket.on(event, handler);

    return () => {
        listeners.delete(handler);
        socket.off(event, handler);
    };
};
