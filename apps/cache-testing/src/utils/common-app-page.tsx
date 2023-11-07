import { Suspense } from 'react';
import { CacheStateWatcher } from 'cache-testing/components/cache-state-watcher';
import { PreRenderedAt } from 'cache-testing/components/pre-rendered-at';
import type { PageProps } from './types';

export function CommonAppPage({ count, revalidateAfter, time, path }: PageProps): JSX.Element {
    return (
        <div>
            <div data-pw="data" id={path}>
                {count}
            </div>
            <PreRenderedAt time={time} />
            <Suspense fallback={null}>
                <CacheStateWatcher revalidateAfter={revalidateAfter} time={time} />
            </Suspense>
        </div>
    );
}
