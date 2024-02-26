import assert from 'node:assert';
import { test } from 'node:test';
import { MAX_INT32 } from '../constants';
import { createValidatedAgeEstimationFunction } from './create-validated-age-estimation-function';

await test('returns the same age for simple callback', () => {
    const estimateAge = createValidatedAgeEstimationFunction((age) => age);
    const testAge = 100;
    assert.strictEqual(estimateAge(testAge), testAge, 'The estimated age should equal the input age.');
});

await test('throws error for negative age', () => {
    const estimateAge = createValidatedAgeEstimationFunction((age) => age);
    const testAge = -1;
    assert.throws(
        () => estimateAge(testAge),
        /The expire age must be a positive integer but got/,
        'Should throw error for negative age.',
    );
});

await test('handles float by flooring', () => {
    const estimateAge = createValidatedAgeEstimationFunction((age) => age + 0.9);
    const testAge = 100;
    assert.strictEqual(estimateAge(testAge), 100, 'The estimated age should be floored to the nearest lower integer.');
});

await test('handles numbers bigger than MAX_INT32 by returning MAX_INT32', () => {
    const estimateAge = createValidatedAgeEstimationFunction((age) => age + MAX_INT32);
    assert.strictEqual(
        estimateAge(100),
        MAX_INT32,
        'The estimated age should return MAX_INT32 for numbers bigger than MAX_INT32.',
    );
});

await test('throws error for non-integer', () => {
    const estimateAge = createValidatedAgeEstimationFunction((age) => age + Number.NaN);
    assert.throws(
        () => estimateAge(10),
        /The expire age must be a positive integer but got/,
        'Should throw error for non-integer values.',
    );
});

await test('throws error for zero', () => {
    const estimateAge = createValidatedAgeEstimationFunction((age) => age * 0);
    assert.throws(
        () => estimateAge(10),
        /The expire age must be a positive integer but got/,
        'Should throw error for zero.',
    );
});

await test('handles MAX_INT32 correctly', () => {
    const estimateAge = createValidatedAgeEstimationFunction((_age) => MAX_INT32);
    assert.strictEqual(estimateAge(0), MAX_INT32, 'The estimated age should handle MAX_INT32 correctly.');
});

await test('throws error for non-numeric input', () => {
    const estimateAge = createValidatedAgeEstimationFunction((_age) => 'non-numeric' as unknown as number);
    assert.throws(
        () => estimateAge(10),
        /The expire age must be a positive integer but got/,
        'Should throw error for non-numeric input.',
    );
});

await test('callback throws an error', () => {
    const estimateAge = createValidatedAgeEstimationFunction(() => {
        throw new Error('Test error');
    });
    assert.throws(() => estimateAge(10), /Test error/, 'Should propagate callback errors.');
});
