import { type JSX, Suspense } from 'react';

import type { PageProps } from './types';

import { CacheStateWatcher } from 'cache-testing-15-app/components/cache-state-watcher';
import { PreRenderedAt } from 'cache-testing-15-app/components/pre-rendered-at';

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
