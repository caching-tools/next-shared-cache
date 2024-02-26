import { formatTime } from 'cache-testing/utils/format-time';

type CacheStateWatcherProps = { time: number; isFallback?: boolean };

export function PreRenderedAt({ time, isFallback }: CacheStateWatcherProps): JSX.Element {
    const preRenderTime = isFallback ? '' : formatTime(time, 3);

    return <div data-pw="pre-rendered-at">Pre-rendered at {preRenderTime}</div>;
}
