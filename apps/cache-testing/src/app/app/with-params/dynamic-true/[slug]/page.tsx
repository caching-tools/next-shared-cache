import { notFound } from 'next/navigation';
import { createGetData } from '../../../../../utils/create-get-data';
import { CommonAppPage } from '../../../../../utils/common-app-page';

type PageParams = { params: { slug: string } };

export const dynamicParams = true;

export const revalidate = 5;

const getData = createGetData('app/with-params/dynamic-true');

export function generateStaticParams(): Promise<PageParams['params'][]> {
    return Promise.resolve([{ slug: '200' }, { slug: '404' }, { slug: 'alternate-200-404' }]);
}

export default async function Index({ params }: PageParams): Promise<JSX.Element> {
    const data = await getData(params.slug);

    if (!data) {
        notFound();
    }

    const { count, path, time } = data;

    return <CommonAppPage count={count} path={path} revalidateAfter={revalidate * 1000} time={time} />;
}
