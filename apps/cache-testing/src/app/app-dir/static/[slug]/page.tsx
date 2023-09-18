import { notFound } from 'next/navigation';

export const dynamicParams = false;

type PageParams = { params: { slug: string } };

async function getData(slug: string): Promise<string | null> {
    const result = await fetch(`http://localhost:8081/${slug}`, {
        next: { revalidate: 5, tags: ['my-tag-static'] },
    });

    if (!result.ok) {
        return null;
    }

    const parsedResult = (await result.json()) as { name: string } | null;

    if (!parsedResult) {
        return null;
    }

    return parsedResult.name;
}

export function generateStaticParams(): Promise<PageParams['params'][]> {
    return Promise.resolve([{ slug: '200' }, { slug: '404' }, { slug: 'alternate-200-404' }]);
}

export default async function Index({ params }: PageParams): Promise<JSX.Element> {
    const name = await getData(params.slug);

    if (!name) {
        notFound();
    }

    return <div id="app-dir-page-static">{name}</div>;
}
