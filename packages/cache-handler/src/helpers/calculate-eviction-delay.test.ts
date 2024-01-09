import { test } from 'node:test';
import assert from 'node:assert';
import { calculateEvictionDelay } from './calculate-eviction-delay';

await test('should return undefined if originalTtl is not provided', () => {
    const result = calculateEvictionDelay(undefined, true);
    assert.strictEqual(result, undefined);
});

await test('should return originalTtl if useTtl is not a function', () => {
    const result = calculateEvictionDelay(100, true);
    assert.strictEqual(result, 100);
});

await test('should return computedTtl if useTtl is a function', () => {
    const result = calculateEvictionDelay(100, (ttl) => ttl * 2);
    assert.strictEqual(result, 200);
});

await test('should return undefined if originalTtl is null', () => {
    const result = calculateEvictionDelay(null as unknown as undefined, true);
    assert.strictEqual(result, undefined);
});

await test('should return originalTtl if useTtl is null', () => {
    const result = calculateEvictionDelay(100, null as unknown as boolean);
    assert.strictEqual(result, 100);
});

await test('should return originalTtl if useTtl is undefined', () => {
    const result = calculateEvictionDelay(100, undefined as unknown as boolean);
    assert.strictEqual(result, 100);
});

await test('should throw error if computedTtl is not a number', () => {
    try {
        calculateEvictionDelay(100, () => 'not a number' as unknown as number);
        assert.fail('Expected to throw error');
    } catch (error) {
        if (error instanceof Error) {
            assert.match(error.message, /Invalid eviction delay/);
        }
    }
});

await test('should throw error if computedTtl is NaN', () => {
    try {
        calculateEvictionDelay(100, () => NaN);
        assert.fail('Expected to throw error');
    } catch (error) {
        if (error instanceof Error) {
            assert.match(error.message, /Invalid eviction delay/);
        }
    }
});

await test('should throw error if computedTtl is equal to 0', () => {
    try {
        calculateEvictionDelay(100, () => 0);
        assert.fail('Expected to throw error');
    } catch (error) {
        if (error instanceof Error) {
            assert.match(error.message, /Invalid eviction delay/);
        }
    }
});

await test('should throw error if computedTtl is a negative number', () => {
    try {
        calculateEvictionDelay(100, () => -50);
        assert.fail('Expected to throw error');
    } catch (error) {
        if (error instanceof Error) {
            assert.match(error.message, /Invalid eviction delay/);
        }
    }
});

await test('should throw error if computedTtl is Infinity', () => {
    try {
        calculateEvictionDelay(100, () => Infinity);
        assert.fail('Expected to throw error');
    } catch (error) {
        if (error instanceof Error) {
            assert.match(error.message, /Invalid eviction delay/);
        }
    }
});

await test('should throw error if computedTtl is -Infinity', () => {
    try {
        calculateEvictionDelay(100, () => -Infinity);
        assert.fail('Expected to throw error');
    } catch (error) {
        if (error instanceof Error) {
            assert.match(error.message, /Invalid eviction delay/);
        }
    }
});
