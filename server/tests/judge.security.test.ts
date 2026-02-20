import { JudgeService } from '../src/services/judge.service';

describe('JudgeService Security and Correctness', () => {
    // Mock Prisma behavior would be ideal here in a real setup.
    // For this security scan, we will focus on unit testing the evaluation logic using the private methods if accessible (or modifying visibility)
    // or we can test `evaluateJavascript` logic directly if we extract it or inspect it. 
    // Since we can't easily execute private methods in TS without suppresses, we'll mimic the logic or use a public wrapper.

    // To unit test the isolate runner specifically without DB:
    // We will cast to any to access private method for testing purposes OR we can blindly trust the flow if we had integration tests.
    // Let's use `any` casting to test the critical security sandbox.

    const runIsolate = (JudgeService as any).runJavascriptIsolate;

    test('Should evaluate correct code successfully', async () => {
        const result = await runIsolate('console.log(input * 2)', '5');
        expect(result.trim()).toBe('10');
    });

    test('Should block access to process.env', async () => {
        const code = 'console.log(JSON.stringify(process.env))';
        const result = await runIsolate(code, '');
        // Expect empty object {}
        expect(result).not.toContain('NODE_ENV');
        expect(result.trim()).toBe('{}');
    });

    test('Should block infinite loops via timeout', async () => {
        const code = 'while(true) {}';
        const result = await runIsolate(code, '');
        expect(result).toContain('Error');
    });

    test('Should not allow requiring modules', async () => {
        const code = 'const fs = require("fs"); console.log("loaded");';
        const result = await runIsolate(code, '');
        expect(result).toContain('Error');
        expect(result).not.toContain('loaded');
    });

    test('Should handle prototype pollution attempts (basic)', async () => {
        // VM contexts usually protect against modifying the host Object prototype, but let's verify context isolation.
        const code = 'Object.prototype.toString = () => "pwned"; console.log({}.toString())';
        const result = await runIsolate(code, '');
        expect(result.trim()).toBe('pwned');

        // Critically, this should ONLY affect the sandbox, not the host.
        // We verify the HOST is okay:
        expect({}.toString()).not.toBe('pwned');
    });
});
