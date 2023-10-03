'use client';

import { useEffect, useState } from 'react';

type CacheStateWatcherProps = { time: number; revalidateAfter: number };

export function CacheStateWatcher({ time, revalidateAfter }: CacheStateWatcherProps): JSX.Element {
    const [cacheState, setCacheState] = useState('');
    const [countDown, setCountDown] = useState('');

    useEffect(() => {
        let id = -1;

        function check(): void {
            const now = Date.now();

            setCountDown(Math.max(0, (time + revalidateAfter - now) / 1000).toFixed(3));

            if (now > time + revalidateAfter) {
                setCacheState('stale');

                return;
            }

            setCacheState('fresh');

            id = requestAnimationFrame(check);
        }

        id = requestAnimationFrame(check);

        return () => {
            cancelAnimationFrame(id);
        };
    }, [revalidateAfter, time]);

    const formattedTime = new Date(time).toLocaleTimeString('ru-RU', {
        fractionalSecondDigits: 3,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return (
        <div>
            <div data-pw="pre-rendered-at">Pre-rendered at {formattedTime}</div>
            <div data-pw="cache-state">Cache state: {cacheState}</div>
            <div data-pw="stale-after">Stale after: {countDown}</div>
        </div>
    );
}
