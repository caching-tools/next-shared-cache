import assert from 'node:assert/strict';
import { MAX_INT32 } from '../constants.js';

type EstimateExpireAgeFunction = typeof getInitialExpireAge;

/**
 * Calculates an initial expiration age based on the stale age.
 *
 * By default, this function sets the expiration age to 1.5 times the stale age,
 * creating a buffer period between when content becomes stale and when it expires.
 *
 * @param staleAge - The time in seconds when the cache entry becomes stale
 *
 * @returns The calculated expiration age in seconds
 */
export function getInitialExpireAge(staleAge: number): number {
  return staleAge * 1.5;
}

/**
 * Creates a validated age estimation function with safety boundaries.
 *
 * This function wraps the provided callback function with validation to ensure
 * the returned expire age is:
 * 1. A positive integer
 * 2. Not exceeding MAX_INT32 (2147483647)
 * 3. Floored to the nearest integer
 *
 * @param callback - A function that calculates expire age from stale age
 * @returns A validated function that safely converts stale age to expire age
 * @throws Assertion error if the calculated expire age is not a positive integer
 *
 * @example
 * ```
 * // Using default implementation (1.5x multiplier)
 * const defaultEstimator = composeAgeEstimationFn();
 * const expireAge = defaultEstimator(3600); // 5400
 *
 * // Using custom implementation
 * const customEstimator = composeAgeEstimationFn(staleAge => staleAge * 2);
 * const expireAge = customEstimator(3600); // 7200
 * ```
 */
export function composeAgeEstimationFn(
  callback = getInitialExpireAge,
): EstimateExpireAgeFunction {
  return function estimateExpireAge(staleAge: number): number {
    const rawExpireAge = callback(staleAge);

    const expireAge = Math.min(Math.floor(rawExpireAge), MAX_INT32);

    // Number.isInteger also checks for NaN, Infinity, -Infinity and non-numeric values.
    assert(
      Number.isInteger(expireAge) && expireAge > 0,
      `The expire age must be a positive integer but got a ${expireAge}.`,
    );

    return expireAge;
  };
}
