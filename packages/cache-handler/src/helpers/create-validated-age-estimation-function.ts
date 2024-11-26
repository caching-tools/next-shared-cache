import assert from 'node:assert/strict';
import { MAX_INT32 } from '../constants';

type EstimateExpireAgeFunction = typeof getInitialExpireAge;

/**
 * Returns the initial expire age based on the provided stale age.
 *
 * @param staleAge - The stale age value.
 *
 * @returns The initial expire age.
 */
export function getInitialExpireAge(staleAge: number): number {
    return staleAge * 1.5;
}

/**
 * Creates a validated age estimation function.
 *
 * @param callback - The callback function to calculate the expire age based on the stale age.
 *
 * @returns The age estimation function. This function will return the expire age based on the stale age.
 * Its return value will be a positive integer and less than 2147483647.
 */
export function createValidatedAgeEstimationFunction(callback = getInitialExpireAge): EstimateExpireAgeFunction {
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
