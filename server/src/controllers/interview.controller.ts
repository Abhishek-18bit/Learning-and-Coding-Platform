import { Request, Response } from 'express';
import * as interviewService from '../services/interview.service';
import { catchAsync } from '../utils/errors';

export const getQuestions = catchAsync(async (req: Request, res: Response) => {
    const category = req.query.category as string;
    const search = req.query.search as string;
    const userId = (req as any).user.id;

    const questions = await interviewService.getAllInterviewQuestions(userId, category, search);

    res.json({
        success: true,
        data: questions
    });
});

export const createQuestion = catchAsync(async (req: Request, res: Response) => {
    const question = await interviewService.createInterviewQuestion(req.body);

    res.status(201).json({
        success: true,
        data: question
    });
});

export const markCompleted = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { interviewQuestionId } = req.body;

    await interviewService.safeMarkCompleted(userId, interviewQuestionId);

    // Emit socket event
    const { emitToUser } = await import('../utils/socket');
    emitToUser(userId, 'INTERVIEW_PROGRESS_UPDATE', {
        interviewQuestionId,
        completed: true
    });

    res.json({
        success: true,
        message: 'Marked as completed'
    });
});
