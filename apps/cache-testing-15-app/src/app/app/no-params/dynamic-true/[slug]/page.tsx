import { notFound } from 'next/navigation';

import { CommonAppPage } from 'cache-testing-15-app/utils/common-app-page';
import { createGetData } from 'cache-testing-15-app/utils/create-get-data';

import type { JSX } from 'react';

export const dynamicParams = true;

export const revalidate = 5;

type PageParams = { params: Promise<{ slug: string }> };

const getData = createGetData('app/no-params/dynamic-true');

export default async function Index(props: PageParams): Promise<JSX.Element> {
    const params = await props.params;
    const data = await getData(params.slug);

    if (!data) {
        notFound();
    }

    const { count, path, time } = data;

    return <CommonAppPage count={count} path={path} revalidateAfter={revalidate * 1000} time={time} />;
}
