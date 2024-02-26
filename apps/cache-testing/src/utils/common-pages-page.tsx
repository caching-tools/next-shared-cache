import type { PageProps } from './types';

import { CacheStateWatcher } from 'cache-testing/components/cache-state-watcher';
import { PreRenderedAt } from 'cache-testing/components/pre-rendered-at';
import { useRouter } from 'next/router';

export function CommonPagesPage({ count, revalidateAfter, time, path }: PageProps): JSX.Element {
    const { isFallback } = useRouter();

    return (
        <div>
            <div data-pw="data" id={path}>
                {count}
            </div>
            <PreRenderedAt isFallback={isFallback} time={time} />
            <CacheStateWatcher revalidateAfter={revalidateAfter} time={time} />
        </div>
    );
}
