import { notFound } from 'next/navigation';

import { CommonAppPage } from 'cache-testing/utils/common-app-page';
import { createGetData } from 'cache-testing/utils/create-get-data';

export const dynamicParams = false;

export const revalidate = 5;

type PageParams = { params: { slug: string } };

const getData = createGetData('app/no-params/dynamic-false');

export default async function Index({ params }: PageParams): Promise<JSX.Element> {
    const data = await getData(params.slug);

    if (!data) {
        notFound();
    }

    const { count, path, time } = data;

    return <CommonAppPage count={count} path={path} revalidateAfter={revalidate * 1000} time={time} />;
}
