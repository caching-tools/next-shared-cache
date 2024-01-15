import { Suspense } from 'react';

import type { PageProps } from './types';

import { CacheStateWatcher } from 'cache-testing/components/cache-state-watcher';
import { PreRenderedAt } from 'cache-testing/components/pre-rendered-at';

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
