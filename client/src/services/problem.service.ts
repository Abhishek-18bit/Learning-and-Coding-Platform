import api from './api';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type SubmissionStatus = 'PENDING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'ERROR';

export interface ProblemTestCase {
    id: string;
    input: string;
    expectedOutput: string | null;
    isHidden: boolean;
}

export interface Problem {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    inputFormat: string;
    outputFormat: string;
    constraints: string;
    starterCode: string;
    lessonId?: string | null;
    lesson?: {
        id: string;
        title: string;
        courseId?: string;
        course?: {
            id: string;
            title: string;
        };
    } | null;
    testCases?: ProblemTestCase[];
    createdAt?: string;
}

export interface Submission {
    id: string;
    studentId: string;
    problemId: string;
    code: string;
    language: string;
    status: SubmissionStatus;
    executionTime?: number | null;
    createdAt: string;
    problem?: {
        id: string;
        title: string;
    };
}

export interface SubmitSummary {
    passedTestCount: number;
    failedTestCount: number;
    executionTime: number;
    finalVerdict: SubmissionStatus;
}

export interface CustomRunResult {
    output: string;
    executionTime: number;
    status: SubmissionStatus;
    error: string | null;
    expectedOutput: string | null;
    isMatch: boolean | null;
}

export interface ProblemSubmissionResponse {
    submission: Submission;
    summary: SubmitSummary;
}

export interface CreateProblemPayload {
    title: string;
    description: string;
    difficulty: Difficulty;
    inputFormat: string;
    outputFormat: string;
    constraints: string;
    starterCode: string;
    lessonId?: string;
    testCases: Array<{
        input: string;
        expectedOutput: string;
        isHidden: boolean;
    }>;
}

export const problemService = {
    getAll: async (lessonId?: string) => {
        const response = await api.get<{ success: boolean; problems: Problem[] }>(`/problems`, {
            params: lessonId ? { lessonId } : undefined,
        });
        return response.data.problems;
    },

    getProblemsByLesson: async (lessonId: string) => {
        const response = await api.get<{ success: boolean; problems: Problem[] }>(`/lessons/${lessonId}/problems`);
        return response.data.problems;
    },

    getProblemById: async (problemId: string) => {
        const response = await api.get<{ success: boolean; problem: Problem }>(`/problems/${problemId}`);
        return response.data.problem;
    },

    submitByProblemId: async (problemId: string, language: string, code: string) => {
        const response = await api.post<{ success: boolean; submission: Submission; summary: SubmitSummary }>(
            `/problems/${problemId}/submit`,
            {
                language,
                code,
            }
        );
        return {
            submission: response.data.submission,
            summary: response.data.summary,
        };
    },

    runCustomByProblemId: async (
        problemId: string,
        language: string,
        code: string,
        input: string,
        expectedOutput?: string
    ) => {
        const response = await api.post<{ success: boolean; result: CustomRunResult }>(
            `/problems/${problemId}/run-custom`,
            {
                language,
                code,
                input,
                ...(typeof expectedOutput === 'string' ? { expectedOutput } : {}),
            }
        );

        return response.data.result;
    },

    submitCode: async (problemId: string, language: string, code: string) => {
        const response = await api.post<{ success: boolean; submission: Submission }>(`/submissions`, {
            problemId,
            language,
            code,
        });
        return response.data.submission;
    },

    getMySubmissions: async () => {
        const response = await api.get<{ success: boolean; submissions: Submission[] }>(`/submissions/me`);
        return response.data.submissions;
    },

    create: async (data: CreateProblemPayload) => {
        const response = await api.post<{ success: boolean; problem: Problem }>(`/problems`, {
            title: data.title,
            description: data.description,
            difficulty: data.difficulty,
            inputFormat: data.inputFormat,
            outputFormat: data.outputFormat,
            constraints: data.constraints,
            starterCode: data.starterCode,
            lessonId: data.lessonId,
        });

        const createdProblem = response.data.problem;

        if (data.testCases.length) {
            await api.post(`/problems/${createdProblem.id}/testcases`, {
                testCases: data.testCases.map((testCase) => ({
                    input: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    isHidden: testCase.isHidden,
                })),
            });
        }

        return createdProblem;
    }
};
