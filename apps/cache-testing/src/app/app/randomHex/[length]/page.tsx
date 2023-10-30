import { notFound } from 'next/navigation';
import type { RandomHexPageProps } from 'cache-testing/utils/types';

const lengthSteps = new Array(5).fill(0).map((_, i) => 10 ** (i + 1));

type PageParams = { params: { length: string } };

export function generateStaticParams(): PageParams['params'][] {
    return lengthSteps.map((length) => ({ length: `${length}` }));
}

export default async function Page({ params: { length } }: PageParams): Promise<JSX.Element> {
    const path = `/randomHex/${length}`;

    const url = new URL(path, 'http://localhost:8081');

    const result = await fetch(url);

    if (!result.ok) {
        notFound();
    }

    const { randomHex } = (await result.json()) as RandomHexPageProps;

    return (
        <div>
            <div data-pw="randomHex">{randomHex}</div>
        </div>
    );
}
