import { commandOptions } from 'redis';

type CommandOptions = ReturnType<typeof commandOptions>;

export function getTimeoutRedisCommandOptions(timeoutMs: number): CommandOptions {
    if (timeoutMs === 0) {
        return commandOptions({});
    }

    return commandOptions({ signal: AbortSignal.timeout(timeoutMs) });
}
