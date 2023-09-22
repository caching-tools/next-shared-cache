import { notFound } from 'next/navigation';

type PageParams = { params: { slug: string } };

export const dynamicParams = true;

async function getData(slug: string): Promise<number | null> {
    const result = await fetch(`http://localhost:8081/${slug}`, {
        next: { revalidate: 60, tags: ['my-tag-static'] },
    });

    if (!result.ok) {
        return null;
    }

    const parsedResult = (await result.json()) as { count: number } | null;

    if (!parsedResult) {
        return null;
    }

    return parsedResult.count;
}

export function generateStaticParams(): Promise<PageParams['params'][]> {
    return Promise.resolve([{ slug: '200' }, { slug: '404' }, { slug: 'alternate-200-404' }]);
}

export default async function Index({ params }: PageParams): Promise<JSX.Element> {
    const count = await getData(params.slug);

    if (!count) {
        notFound();
    }

    return <div id="app/with-params/dynamic-true">{count}</div>;
}
