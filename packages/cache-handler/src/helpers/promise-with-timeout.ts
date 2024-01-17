import { MAX_INT32 } from '../constants';

/**
 * Wraps a Promise with a timeout, rejecting the Promise if it does not resolve within the specified time.
 *
 * @param operation - The Promise to wrap with a timeout.
 * @param timeoutMs - Optional. The timeout period in milliseconds.
 * If this is not a positive number, the function will simply return the original Promise.
 *
 * @returns A new Promise that behaves like the original Promise,
 * but will be rejected if the original Promise does not resolve within the specified timeout.
 *
 * @throws If the operation does not complete within the specified timeout,
 * the returned Promise will be rejected with an Error that has a message indicating the timeout period.
 */
export function promiseWithTimeout<T>(operation: Promise<T>, timeoutMs?: number): Promise<T> {
    if (typeof timeoutMs !== 'number' || isNaN(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_INT32) {
        return operation;
    }

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(reject, timeoutMs, new Error(`Operation timed out after ${timeoutMs} ms`));

        operation
            .then((result) => {
                clearTimeout(timeoutId);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                reject(error as Error);
            });
    });
}
