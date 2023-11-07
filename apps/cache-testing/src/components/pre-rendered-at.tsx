import { formatTime } from 'cache-testing/utils/format-time';

type CacheStateWatcherProps = { time: number };

export function PreRenderedAt({ time }: CacheStateWatcherProps): JSX.Element {
    const preRenderTime = formatTime(time, 3);

    return <div data-pw="pre-rendered-at">Pre-rendered at {preRenderTime}</div>;
}
