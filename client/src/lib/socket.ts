import { io, Socket } from 'socket.io-client';
import { API_ORIGIN } from '../config/runtime';

type GenericSocketHandler = (...args: any[]) => void;

const LISTENER_REGISTRY = new WeakMap<Socket, Map<string, Set<GenericSocketHandler>>>();

let socketInstance: Socket | null = null;
let currentToken: string | null = null;

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

    socketInstance = io(API_ORIGIN, {
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
