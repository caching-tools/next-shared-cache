import { Suspense } from 'react';
import { CacheStateWatcher } from '../components/cache-state-watcher';
import type { PageProps } from './types';

export function CommonAppPage({ count, revalidateAfter, time, path }: PageProps): JSX.Element {
    return (
        <div>
            <div data-pw="data" id={path}>
                {count}
            </div>
            <Suspense fallback={null}>
                <CacheStateWatcher revalidateAfter={revalidateAfter} time={time} />
            </Suspense>
        </div>
    );
}
