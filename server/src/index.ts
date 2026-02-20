import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { createServer } from 'http';
import { config } from './utils/config';
import prisma from './db/prisma';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import lessonRoutes from './routes/lesson.routes';
import problemRoutes from './routes/problem.routes';
import submissionRoutes from './routes/submission.routes';
import quizRoutes from './routes/quiz.routes';
import dashboardRoutes from './routes/dashboard.routes';
import interviewRoutes from './routes/interview.routes';
import materialRoutes from './routes/material.routes';
import battleRoutes from './routes/battle.routes';
import chatRoutes from './routes/chat.routes';
import { handleError } from './utils/errors';
import { initSocket } from './utils/socket';
import { BattleService } from './services/battle.service';


//import { BattleService } from './services/battle.service';


const app: Express = express();
const httpServer = createServer(app);

initSocket(httpServer);

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', async (_req: Request, res: Response) => {
    try {
        await prisma.user.count();
        res.json({ status: 'OK', message: 'Server and Database are healthy' });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({ status: 'ERROR', message: 'Database unreachable' });
    }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    handleError(err, res);
});

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('Connected to database');

        try {
            await BattleService.bootstrapLiveRooms();
            console.log('Battle timers initialized');
        } catch (bootstrapError) {
            console.error('Battle timer bootstrap failed:', bootstrapError);
        }

        httpServer.listen(config.PORT, () => {
            console.log(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
