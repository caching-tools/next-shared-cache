import { notFound } from 'next/navigation';
import { normalizeSlug } from '../../../../../utils/normalize-slug';

export const dynamicParams = false;

type PageParams = { params: { slug: string } };

async function getData(slug: string): Promise<number | null> {
    const result = await fetch(`http://localhost:8081/app/no-params/dynamic-false/${normalizeSlug(slug)}`, {
        next: { revalidate: 10, tags: [`/app/no-params/dynamic-false/${normalizeSlug(slug)}`] },
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

    return (
        <div data-pw="data" id="app/no-params/dynamic-false">
            {count}
        </div>
    );
}
