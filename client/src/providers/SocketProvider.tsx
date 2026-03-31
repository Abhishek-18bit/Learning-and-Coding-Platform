import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { getAuthToken } from '../utils/authToken';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    connected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const token = getAuthToken();
        if (!user || !token) {
            disconnectSocket();
            setSocket(null);
            setConnected(false);
            return;
        }

        const socketInstance = connectSocket(token);
        if (!socketInstance) {
            setSocket(null);
            setConnected(false);
            return;
        }

        const handleConnect = () => {
            setConnected(true);
            socketInstance.emit('join', user.id);
        };

        const handleDisconnect = () => {
            setConnected(false);
        };

        socketInstance.off('connect', handleConnect);
        socketInstance.off('disconnect', handleDisconnect);
        socketInstance.on('connect', handleConnect);
        socketInstance.on('disconnect', handleDisconnect);

        if (socketInstance.connected) {
            handleConnect();
        } else {
            setConnected(false);
        }

        setSocket(socketInstance);

        return () => {
            socketInstance.off('connect', handleConnect);
            socketInstance.off('disconnect', handleDisconnect);
        };
    }, [user?.id, user?.role]);

    useEffect(() => () => {
        disconnectSocket();
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
