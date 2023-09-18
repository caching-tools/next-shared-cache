import { notFound } from 'next/navigation';
import { normalizeSlug } from '../../../../../utils/normalize-slug';

export const dynamicParams = true;

type PageParams = { params: { slug: string } };

async function getData(slug: string): Promise<number | null> {
    const result = await fetch(`http://localhost:8081/${normalizeSlug(slug)}`, {
        next: { revalidate: 5, tags: ['my-tag-dynamic'] },
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

export default async function Index({ params }: PageParams): Promise<JSX.Element> {
    const count = await getData(params.slug);

    if (typeof count === 'undefined') {
        notFound();
    }

    return <div id="app/no-params/dynamic-true">{count}</div>;
}
