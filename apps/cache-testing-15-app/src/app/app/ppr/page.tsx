import { unstable_noStore as noStore } from 'next/cache';
import { type JSX, Suspense } from 'react';

import { formatTime } from 'cache-testing-15-app/utils/format-time';
import type { TimeBackendApiResponseJson } from 'cache-testing-15-app/utils/types';

async function ActualData(): Promise<JSX.Element> {
    noStore();

    const response = await fetch('http://localhost:8081/time', {
        next: { tags: ['/app/ppr'] },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch unix time');
    }

    const data = (await response.json()) as TimeBackendApiResponseJson;

    return <div data-pw="ppr-postponed">{formatTime(data.unixTimeMs)}</div>;
}

function Skeleton(): JSX.Element {
    return <div data-pw="ppr-prerendered">Skeleton</div>;
}

export default function Page(): JSX.Element {
    return (
        <main>
            <h3>Partial Prerendering</h3>
            <Suspense fallback={<Skeleton />}>
                <ActualData />
            </Suspense>
        </main>
    );
}
