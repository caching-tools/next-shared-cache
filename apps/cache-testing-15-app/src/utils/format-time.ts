export function formatTime(time: number | string | Date = Date.now(), fractionalSecondDigits?: 1 | 2 | 3): string {
    return new Date(time).toLocaleTimeString('en-GB', {
        fractionalSecondDigits,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}
