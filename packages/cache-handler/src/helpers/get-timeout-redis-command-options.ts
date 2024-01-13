import { commandOptions } from 'redis';

type CommandOptions = ReturnType<typeof commandOptions>;

export function getTimeoutRedisCommandOptions(timeoutMs: number): CommandOptions {
    return commandOptions({ signal: AbortSignal.timeout(timeoutMs) });
}
