import { commandOptions } from 'redis';

type CommandOptions = ReturnType<typeof commandOptions>;

export function getTimeoutRedisCommandOptions(timeoutMs: number): CommandOptions {
    return commandOptions(!!timeoutMs && timeoutMs !== 0 ? { signal: AbortSignal.timeout(timeoutMs) } : {});
}
