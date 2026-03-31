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
    let statusCode = isApiError ? err.statusCode : 500;
    let message = isApiError ? err.message : 'Internal Server Error';
    const rawMessage = String(err?.message || '').toLowerCase();
    const isHierarchySchemaMismatch =
        rawMessage.includes('courseunit') ||
        rawMessage.includes('coursetopic') ||
        rawMessage.includes('unitid') ||
        rawMessage.includes("reading 'findfirst'") ||
        rawMessage.includes('is not a function');

    // Prisma schema mismatch (typically after deploying code without DB migration).
    if (!isApiError && (err?.code === 'P2021' || err?.code === 'P2022' || isHierarchySchemaMismatch)) {
        statusCode = 503;
        message = 'Course unit/topic schema is not ready in the database. Run `npm --prefix server run migrate:deploy` and restart the server.';
    } else if (!isApiError && err?.code === 'P2023') {
        statusCode = 400;
        message = 'Invalid request identifier format.';
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
