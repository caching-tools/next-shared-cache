import { test } from 'node:test';
import assert from 'node:assert';
import { promiseWithTimeout } from './promise-with-timeout';

function simulateOperation(duration: number): Promise<string> {
    return new Promise((resolve) => {
        setTimeout(resolve, duration, 'completed');
    });
}

await test('should resolve if operation finishes before timeout', async () => {
    const fastOperation = simulateOperation(100);
    const result = await promiseWithTimeout(fastOperation, 200);
    assert.strictEqual(result, 'completed');
});

await test('should reject if operation times out', async () => {
    const slowOperation = simulateOperation(300);
    try {
        await promiseWithTimeout(slowOperation, 100);
        assert.fail('Expected operation to time out');
    } catch (error) {
        if (error instanceof Error) {
            assert.match(error.message, /timed out/);
        }
    }
});

await test('should allow operation without timeout when timeoutMs is undefined', async () => {
    const operation = simulateOperation(100);
    const result = await promiseWithTimeout(operation);
    assert.strictEqual(result, 'completed');
});

await test('should return original operation if timeoutMs is not a number', async () => {
    const operation = simulateOperation(100);
    const result = await promiseWithTimeout(operation, 'not a number' as unknown as number);
    assert.strictEqual(result, 'completed');
});

await test('should return original operation if timeoutMs is NaN', async () => {
    const operation = simulateOperation(100);
    const result = await promiseWithTimeout(operation, NaN);
    assert.strictEqual(result, 'completed');
});

await test('should return original operation if timeoutMs is less than or equal to 0', async () => {
    const operation = simulateOperation(100);
    const result = await promiseWithTimeout(operation, 0);
    assert.strictEqual(result, 'completed');
});

await test('should return original operation if timeoutMs is greater than MAX_INT32', async () => {
    const operation = simulateOperation(100);
    const result = await promiseWithTimeout(operation, Number.MAX_SAFE_INTEGER);
    assert.strictEqual(result, 'completed');
});

await test('should reject if operation throws an error', async () => {
    const errorOperation = new Promise((_, reject) => {
        setTimeout(reject, 100, new Error('Operation error'));
    });

    try {
        await promiseWithTimeout(errorOperation, 200);
        assert.fail('Expected operation to throw an error');
    } catch (error) {
        if (error instanceof Error) {
            assert.match(error.message, /Operation error/);
        }
    }
});
