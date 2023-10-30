import type { GetStaticPathsResult, GetStaticPropsContext, GetStaticPropsResult } from 'next';
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

    const pathAndTag = `/randomHex/${length}`;

    const url = new URL(pathAndTag, 'http://localhost:8081');

    const result = await fetch(url);

    if (!result.ok) {
        return { notFound: true };
    }

    const { randomHex } = (await result.json()) as { randomHex: string };

    return { props: { randomHex } };
}

export function getStaticPaths(): Promise<GetStaticPathsResult> {
    return Promise.resolve({
        paths: lengthSteps.map((length) => ({ params: { length: `${length}` } })),
        fallback: 'blocking',
    });
}

export default function Page({ randomHex }: RandomHexPageProps): JSX.Element {
    return (
        <div>
            <div data-pw="randomHex">{randomHex}</div>
        </div>
    );
}
