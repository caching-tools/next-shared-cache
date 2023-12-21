import { test } from 'node:test';
import assert from 'node:assert';
import { withTimeout } from './with-timeout';

function simulateOperation(duration: number): Promise<string> {
    return new Promise((resolve) => {
        setTimeout(resolve, duration, 'completed');
    });
}

await test('should resolve if operation finishes before timeout', async () => {
    const fastOperation = simulateOperation(100);
    const result = await withTimeout(fastOperation, 200);
    assert.strictEqual(result, 'completed');
});

await test('should reject if operation times out', async () => {
    const slowOperation = simulateOperation(300);
    try {
        await withTimeout(slowOperation, 100);
        assert.fail('Expected operation to time out');
    } catch (error) {
        if (error instanceof Error) {
            assert.match(error.message, /timed out/);
        }
    }
});

await test('should allow operation without timeout when timeoutMs is undefined', async () => {
    const operation = simulateOperation(100);
    const result = await withTimeout(operation);
    assert.strictEqual(result, 'completed');
});
