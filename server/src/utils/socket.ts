import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from './config';
import { registerBattleSocketHandlers } from '../sockets/battle.socket';
import { registerChatSocketHandlers } from '../sockets/chat.socket';

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: config.CORS_ORIGIN,
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log(`[socket] Client connected: ${socket.id}`);

        socket.on('join', (userId: string) => {
            socket.join(userId);
            console.log(`[socket] User ${userId} joined private room`);
        });

        socket.on('disconnect', () => {
            console.log(`[socket] Client disconnected: ${socket.id}`);
        });
    });

    registerBattleSocketHandlers(io);
    registerChatSocketHandlers(io);
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
    if (io) {
        io.to(userId).emit(event, data);
    }
};

export const emitToAll = (event: string, data: any) => {
    if (io) {
        io.emit(event, data);
    }
};
