import { commandOptions } from 'redis';

type CommandOptions = ReturnType<typeof commandOptions>;

/**
 * Creates Redis command options with an optional timeout.
 *
 * This function generates command options for Redis operations with an abort signal
 * that will automatically timeout after the specified duration. If timeoutMs is set to 0,
 * no timeout will be applied.
 *
 * @param timeoutMs - The timeout duration in milliseconds. If set to 0, no timeout will be applied.
 *
 * @returns Redis command options with the specified timeout configuration.
 *
 * @example
 * ```ts
 * // Create command options with a 5-second timeout
 * const options = createRedisTimeoutConfig(5000);
 *
 * // Use the options in a Redis command
 * await client.get(options, 'myKey');
 * ```
 */
export function createRedisTimeoutConfig(timeoutMs: number): CommandOptions {
  if (timeoutMs === 0) {
    return commandOptions({});
  }

  return commandOptions({ signal: AbortSignal.timeout(timeoutMs) });
}
