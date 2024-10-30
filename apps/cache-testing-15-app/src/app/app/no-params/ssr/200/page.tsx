import { notFound } from 'next/navigation';

import { CommonAppPage } from 'cache-testing-15-app/utils/common-app-page';
import { createGetData } from 'cache-testing-15-app/utils/create-get-data';

import type { JSX } from 'react';

const getData = createGetData('app/no-params/ssr', undefined, 'no-store');

export default async function Index(): Promise<JSX.Element> {
    const data = await getData('200');

    if (!data) {
        notFound();
    }

    const { count, path, time } = data;

    return <CommonAppPage count={count} path={path} revalidateAfter={Number.POSITIVE_INFINITY} time={time} />;
}
