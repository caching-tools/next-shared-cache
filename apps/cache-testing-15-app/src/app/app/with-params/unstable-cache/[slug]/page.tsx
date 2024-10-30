import { notFound } from 'next/navigation';

import { CommonAppPage } from 'cache-testing-15-app/utils/common-app-page';
import { createGetData } from 'cache-testing-15-app/utils/create-get-data';

import type { JSX } from 'react';

type PageParams = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export const revalidate = 5;

const getData = createGetData('app/with-params/unstable-cache', revalidate, 'unstable-cache');

export function generateStaticParams(): Promise<PageParams['params'][]> {
    return Promise.resolve([
        Promise.resolve({ slug: '200' }),
        Promise.resolve({ slug: '404' }),
        Promise.resolve({ slug: 'alternate-200-404' }),
    ]);
}

export default async function Index(props: PageParams): Promise<JSX.Element> {
    const params = await props.params;
    const data = await getData(params.slug);

    if (!data) {
        notFound();
    }

    const { count, path, time } = data;

    return <CommonAppPage count={count} path={path} revalidateAfter={revalidate * 1000} time={time} />;
}
