'use client';

import { useEffect, useState } from 'react';

type CacheStateWatcherProps = { time: number; revalidateAfter: number };

export function CacheStateWatcher({ time, revalidateAfter }: CacheStateWatcherProps): JSX.Element {
    const [cacheState, setCacheState] = useState('');
    const [countDown, setCountDown] = useState(0);

    useEffect(() => {
        let id = -1;

        function check(): void {
            const now = Date.now();

            setCountDown(Math.max(0, Math.round((time + revalidateAfter - now) / 1000)));

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

    return (
        <div>
            <div data-pw="prerendered-at">Prerendered at {time}</div>
            <div data-pw="cache-state">Cache state {cacheState}</div>
            <div data-pw="stale-in">Stale in {countDown}</div>
        </div>
    );
}
