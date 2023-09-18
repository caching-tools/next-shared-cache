import { notFound } from 'next/navigation';
import { normalizeSlug } from '../../../../utils/normalize-slug';

export const dynamicParams = true;

type PageParams = { params: { slug: string } };

async function getData(slug: string): Promise<string | null> {
    const result = await fetch(`http://localhost:8081/${normalizeSlug(slug)}`, {
        next: { revalidate: 5, tags: ['my-tag-dynamic'] },
    });

    if (!result.ok) {
        return null;
    }

    const parsedResult = (await result.json()) as { name: string } | null;

    console.log('parsedResult', parsedResult);

    if (!parsedResult) {
        return null;
    }

    return parsedResult.name;
}

export default async function Index({ params }: PageParams): Promise<JSX.Element> {
    console.log('params', params);

    const name = await getData(params.slug);

    if (!name) {
        notFound();
    }

    return <div id="app-dir-page-dynamic">{name}</div>;
}
