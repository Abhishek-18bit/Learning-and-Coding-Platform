import { CourseMaterial, Difficulty } from '@prisma/client';
import prisma from '../db/prisma';
import fs from 'fs';
import path from 'path';
import { ApiError } from '../utils/errors';
import { PdfExtractService } from './pdf-extract.service';
import { QuizGeneratorService } from './quiz-generator.service';
import { QuizService } from './quiz.service';

export class MaterialService {
    static async create(data: {
        title: string;
        fileUrl: string;
        fileType: string;
        courseId: string;
        uploadedBy: string;
    }): Promise<CourseMaterial> {
        return prisma.courseMaterial.create({
            data,
        });
    }

    static async getByCourseId(courseId: string) {
        return prisma.courseMaterial.findMany({
            where: { courseId },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async delete(id: string) {
        const material = await prisma.courseMaterial.findUnique({
            where: { id }
        });

        if (material) {
            // Delete file from local storage
            // In a real S3 scenario, this would delete from S3
            // Assuming fileUrl stores relative path like 'uploads/filename.pdf'
            const filePath = path.resolve(process.cwd(), material.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        return prisma.courseMaterial.delete({
            where: { id }
        });
    }

    static async findById(id: string) {
        return prisma.courseMaterial.findUnique({
            where: { id }
        });
    }

    static async generateQuizFromMaterial(data: {
        materialId: string;
        teacherId: string;
        difficulty: Difficulty;
        questionCount: number;
        title?: string;
        deadline?: string;
    }) {
        const material = await prisma.courseMaterial.findUnique({
            where: { id: data.materialId },
            include: {
                course: {
                    select: {
                        id: true,
                        teacherId: true,
                    },
                },
            },
        });

        if (!material) {
            throw new ApiError(404, 'Material not found');
        }

        if (material.course.teacherId !== data.teacherId) {
            throw new ApiError(403, 'Forbidden: You do not have permission to generate quiz for this material');
        }

        if (material.fileType !== 'application/pdf' || !material.fileUrl.toLowerCase().endsWith('.pdf')) {
            throw new ApiError(400, 'Only PDF material is supported for quiz generation');
        }

        const extractedText = await PdfExtractService.extractCleanTextFromPdf(material.fileUrl);
        const questions = await QuizGeneratorService.generateFromLessonContent({
            lessonTitle: material.title,
            lessonContent: extractedText,
            difficulty: data.difficulty,
            questionCount: data.questionCount,
        });

        if (questions.length === 0) {
            throw new ApiError(422, 'Unable to generate quiz questions from this PDF. Please upload clearer text content.');
        }

        const quizTitle = (data.title || `${material.title} - PDF AI Quiz`).trim().slice(0, 120);
        const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
        const timeLimit = Math.max(5, questions.length * 2);

        return QuizService.createPdfGeneratedQuiz({
            title: quizTitle,
            courseId: material.course.id,
            difficulty: data.difficulty,
            deadline: data.deadline,
            timeLimit,
            totalMarks,
            questions,
        });
    }
}
