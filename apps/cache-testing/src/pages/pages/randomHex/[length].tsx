import type { GetStaticPathsResult, GetStaticPropsContext, GetStaticPropsResult } from 'next';

import { CacheStateWatcher } from 'cache-testing/components/cache-state-watcher';
import { PreRenderedAt } from 'cache-testing/components/pre-rendered-at';
import type { RandomHexPageProps } from 'cache-testing/utils/types';

const lengthSteps = new Array(5).fill(0).map((_, i) => 10 ** (i + 1));

export async function getStaticProps({
    params,
}: GetStaticPropsContext): Promise<GetStaticPropsResult<RandomHexPageProps>> {
    if (!params) {
        throw new Error('no params');
    }

    const { length } = params;

    if (!length || Array.isArray(length)) {
        throw new Error('no length');
    }

    const path = `/randomHex/pages/${length}`;

    const url = new URL(path, 'http://localhost:8081');

    const result = await fetch(url);

    if (!result.ok) {
        return { notFound: true };
    }

    const props = (await result.json()) as RandomHexPageProps;

    return { props };
}

export function getStaticPaths(): Promise<GetStaticPathsResult> {
    return Promise.resolve({
        paths: lengthSteps.map((length) => ({ params: { length: `${length}` } })),
        fallback: 'blocking',
    });
}

export default function Page({ randomHex, unixTimeMs }: RandomHexPageProps): JSX.Element {
    return (
        <div>
            <div data-pw="random-hex">{randomHex}</div>
            <PreRenderedAt time={unixTimeMs} />
            <CacheStateWatcher revalidateAfter={Number.POSITIVE_INFINITY} time={unixTimeMs} />
        </div>
    );
}
