import { formatTime } from 'cache-testing-15-app/utils/format-time';

import type { JSX } from 'react';

type CacheStateWatcherProps = { time: number; isFallback?: boolean };

export function PreRenderedAt({ time, isFallback }: CacheStateWatcherProps): JSX.Element {
    const preRenderTime = isFallback ? '' : formatTime(time, 3);

    return <div data-pw="pre-rendered-at">Pre-rendered at {preRenderTime}</div>;
}
