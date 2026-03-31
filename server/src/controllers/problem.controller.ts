import { Request, Response, NextFunction } from 'express';
import { ProblemService } from '../services/problem.service';
import { LessonService } from '../services/lesson.service';
import { SubmissionService } from '../services/submission.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ApiError } from '../utils/errors';

export class ProblemController {
    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            let lessonId: string | undefined;
            if (req.body.lessonId) {
                const lesson = await LessonService.findById(req.body.lessonId);
                if (!lesson) {
                    throw new ApiError(404, 'Lesson not found');
                }

                if (lesson.course.teacherId !== req.user.id && req.user.role !== 'ADMIN') {
                    throw new ApiError(403, 'You do not have permission to add problems to this lesson');
                }

                lessonId = lesson.id;
            }

            const problem = await ProblemService.create({
                title: req.body.title,
                description: req.body.description,
                difficulty: req.body.difficulty,
                inputFormat: req.body.inputFormat,
                outputFormat: req.body.outputFormat,
                constraints: req.body.constraints,
                starterCode: req.body.starterCode,
                createdById: req.user.id,
                lessonId,
            });

            res.status(201).json({
                success: true,
                message: 'Problem created successfully',
                problem,
            });
        } catch (error) {
            next(error);
        }
    }

    static async addTestCases(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const problemId = req.params.id as string;
            const problem = await ProblemService.findById(problemId);
            if (!problem) {
                throw new ApiError(404, 'Problem not found');
            }

            const problemTeacherId = problem.lesson?.course?.teacherId || problem.createdById;
            if (req.user.role !== 'ADMIN' && problemTeacherId !== req.user.id) {
                throw new ApiError(403, 'You do not have permission to add test cases to this problem');
            }

            const testCases = await ProblemService.addTestCases(problemId, req.body.testCases);

            res.status(201).json({
                success: true,
                message: 'Test cases added successfully',
                testCases,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const problemId = req.params.id as string;
            const problem = await ProblemService.findById(problemId);
            if (!problem) throw new ApiError(404, 'Problem not found');

            // Hide hidden test-case expected outputs for students.
            const testCases = req.user.role === 'STUDENT'
                ? problem.testCases.map((testCase) => ({
                    id: testCase.id,
                    input: testCase.input,
                    expectedOutput: testCase.isHidden ? null : testCase.expectedOutput,
                    isHidden: testCase.isHidden,
                }))
                : problem.testCases;

            res.status(200).json({
                success: true,
                problem: {
                    ...problem,
                    testCases,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const lessonId = req.query.lessonId as string | undefined;
            const problems = await ProblemService.findAll({ lessonId });

            res.status(200).json({
                success: true,
                problems,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getByLesson(req: Request, res: Response, next: NextFunction) {
        try {
            const lessonId = req.params.lessonId as string;
            const problems = await ProblemService.findByLessonId(lessonId);

            res.status(200).json({
                success: true,
                problems,
            });
        } catch (error) {
            next(error);
        }
    }

    static async submit(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const problemId = req.params.id as string;
            const { code, language } = req.body;

            const result = await SubmissionService.submitAndEvaluate({
                studentId: req.user.id,
                problemId,
                code,
                language,
            });

            const { emitToUser } = await import('../utils/socket');
            emitToUser(req.user.id, 'PROBLEM_SUBMISSION_EVALUATED', {
                problemId,
                submissionId: result.submission.id,
                verdict: result.summary.finalVerdict,
                createdAt: result.submission.createdAt,
            });

            res.status(201).json({
                success: true,
                message: 'Code submitted and evaluated',
                submission: result.submission,
                summary: {
                    passedTestCount: result.summary.passedCount,
                    failedTestCount: result.summary.failedCount,
                    executionTime: result.summary.executionTime,
                    finalVerdict: result.summary.finalVerdict,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async runCustom(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const problemId = req.params.id as string;
            const { code, language, input, expectedOutput } = req.body;

            const result = await SubmissionService.runCustomInput({
                problemId,
                code,
                language,
                input,
                expectedOutput,
            });

            res.status(200).json({
                success: true,
                message: 'Custom testcase executed',
                result,
            });
        } catch (error) {
            next(error);
        }
    }
}
