import { notFound } from 'next/navigation';
import { type JSX, Suspense } from 'react';

import { CacheStateWatcher } from 'cache-testing-15-app/components/cache-state-watcher';
import { PreRenderedAt } from 'cache-testing-15-app/components/pre-rendered-at';
import type { RandomHexPageProps } from 'cache-testing-15-app/utils/types';

const lengthSteps = new Array(5).fill(0).map((_, i) => 10 ** (i + 1));

type PageParams = { params: Promise<{ length: string }> };

export function generateStaticParams(): PageParams['params'][] {
    return lengthSteps.map((length) => Promise.resolve({ length: `${length}` }));
}

export default async function Page(props0: PageParams): Promise<JSX.Element> {
    const params = await props0.params;

    const { length } = params;

    const path = `/randomHex/app/${length}`;

    const url = new URL(path, 'http://localhost:8081');

    const result = await fetch(url, {
        next: {
            tags: [`/app/randomHex/${length}`],
        },
    });

    if (!result.ok) {
        notFound();
    }

    const props = (await result.json()) as RandomHexPageProps;

    return (
        <div>
            <div data-pw="random-hex">{props.randomHex}</div>
            <PreRenderedAt time={props.unixTimeMs} />
            <Suspense fallback={null}>
                <CacheStateWatcher revalidateAfter={Number.POSITIVE_INFINITY} time={props.unixTimeMs} />
            </Suspense>
        </div>
    );
}
