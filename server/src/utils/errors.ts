export class ApiError extends Error {
    public statusCode: number;
    public errors: any[];

    constructor(statusCode: number, message: string, errors: any[] = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

export const handleError = (err: any, res: any) => {
    console.error('Server Error:', err);

    const isApiError = err instanceof ApiError;
    const statusCode = isApiError ? err.statusCode : 500;
    let message = isApiError ? err.message : 'Internal Server Error';

    // Prisma schema mismatch (typically after deploying code without DB migration).
    if (!isApiError && err?.code === 'P2022') {
        message = 'Database schema is outdated. Please run migrations and retry.';
    } else if (!isApiError) {
        message = 'Something went wrong on the server. Please try again.';
    }

    const errors = isApiError ? err.errors : [];

    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};

export const catchAsync = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
