export function withTimeout<T>(operation: Promise<T>, timeoutMs?: number): Promise<T> {
    if (typeof timeoutMs !== 'number' || isNaN(timeoutMs) || timeoutMs <= 0) {
        return operation;
    }

    return new Promise((resolve, reject) => {
        const timeoutHandle = setTimeout(reject, timeoutMs, new Error(`Operation timed out after ${timeoutMs} ms`));

        operation
            .then((result) => {
                clearTimeout(timeoutHandle);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeoutHandle);
                reject(error);
            });
    });
}
