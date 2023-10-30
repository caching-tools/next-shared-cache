import { CacheStateWatcher } from 'cache-testing/components/cache-state-watcher';
import type { PageProps } from './types';

export function CommonPagesPage({ count, revalidateAfter, time, path }: PageProps): JSX.Element {
    return (
        <div>
            <div data-pw="data" id={path}>
                {count}
            </div>
            <CacheStateWatcher revalidateAfter={revalidateAfter} time={time} />
        </div>
    );
}
