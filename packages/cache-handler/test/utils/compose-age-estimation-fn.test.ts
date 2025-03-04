import { describe, expect, it } from 'vitest';
import { MAX_INT32 } from '../../src/constants.js';
import {
  composeAgeEstimationFn,
  getInitialExpireAge,
} from '../../src/utils/compose-age-estimation-fn.js';

describe('composeAgeEstimationFn', () => {
  describe('valid inputs', () => {
    it('returns the same age for simple callback', () => {
      const estimateAge = composeAgeEstimationFn((age) => age);
      const testAge = 100;
      // The estimated age should be the same as the input age
      expect(estimateAge(testAge)).toBe(testAge);
    });

    it('handles float by flooring', () => {
      const estimateAge = composeAgeEstimationFn((age) => age + 0.9);
      const testAge = 100;
      // The estimated age should be floored to the nearest integer
      expect(estimateAge(testAge)).toBe(100);
    });

    it('handles numbers bigger than MAX_INT32 by returning MAX_INT32', () => {
      const estimateAge = composeAgeEstimationFn((age) => age + MAX_INT32);
      // The estimated age should return MAX_INT32 for numbers bigger than MAX_INT32
      expect(estimateAge(100)).toBe(MAX_INT32);
    });

    it('handles MAX_INT32 correctly', () => {
      const estimateAge = composeAgeEstimationFn((_age) => MAX_INT32);
      // The estimated age should handle MAX_INT32 correctly
      expect(estimateAge(0)).toBe(MAX_INT32);
    });

    it('handles value just below MAX_INT32', () => {
      const estimateAge = composeAgeEstimationFn((_age) => MAX_INT32 - 1);
      expect(estimateAge(0)).toBe(MAX_INT32 - 1);
    });

    it('handles Infinity by capping at MAX_INT32', () => {
      const estimateAge = composeAgeEstimationFn(
        (_age) => Number.POSITIVE_INFINITY,
      );
      expect(estimateAge(100)).toBe(MAX_INT32);
    });

    it('uses default callback when none provided', () => {
      const estimateAge = composeAgeEstimationFn();
      // Default multiplies by 1.5 and floors
      expect(estimateAge(100)).toBe(150);
      expect(estimateAge(101)).toBe(151);
    });

    it('default callback handles numbers close to MAX_INT32', () => {
      // Test the getInitialExpireAge function directly
      expect(getInitialExpireAge(MAX_INT32 / 1.5 - 1)).toBeLessThan(MAX_INT32);

      // Test through composeAgeEstimationFn
      const estimateAge = composeAgeEstimationFn();
      const largeStaleAge = Math.floor(MAX_INT32 / 1.5) - 1;
      expect(estimateAge(largeStaleAge)).toBe(Math.floor(largeStaleAge * 1.5));
    });
  });

  describe('invalid inputs', () => {
    it('throws error for negative age', () => {
      const estimateAge = composeAgeEstimationFn((age) => age);
      const testAge = -1;
      expect(() => estimateAge(testAge)).toThrow(
        'The expire age must be a positive integer but got a -1.',
      );
    });

    it('throws error for non-integer', () => {
      const estimateAge = composeAgeEstimationFn((age) => age + Number.NaN);
      expect(() => estimateAge(10)).toThrow(
        'The expire age must be a positive integer but got a NaN.',
      );
    });

    it('throws error for zero', () => {
      const estimateAge = composeAgeEstimationFn((age) => age * 0);
      expect(() => estimateAge(10)).toThrow(
        'The expire age must be a positive integer but got a 0.',
      );
    });

    it('throws error for non-numeric input', () => {
      const estimateAge = composeAgeEstimationFn(
        (_age) => 'non-numeric' as unknown as number,
      );
      expect(() => estimateAge(10)).toThrow(
        'The expire age must be a positive integer but got a NaN.',
      );
    });

    it('callback throws an error', () => {
      const estimateAge = composeAgeEstimationFn(() => {
        throw new Error('Test error');
      });
      expect(() => estimateAge(10)).toThrow('Test error');
    });

    it('handles negative infinity', () => {
      const estimateAge = composeAgeEstimationFn(
        (_age) => Number.NEGATIVE_INFINITY,
      );
      expect(() => estimateAge(10)).toThrow(
        'The expire age must be a positive integer but got a -Infinity.',
      );
    });
  });
});
