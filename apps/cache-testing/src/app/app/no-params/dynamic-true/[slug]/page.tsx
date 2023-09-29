import { notFound } from 'next/navigation';
import { createGetData } from '../../../../../utils/create-get-data';
import { CommonAppPage } from '../../../../../utils/common-app-page';

export const dynamicParams = true;

export const revalidate = 5;

type PageParams = { params: { slug: string } };

const getData = createGetData('app/no-params/dynamic-true');

export default async function Index({ params }: PageParams): Promise<JSX.Element> {
    const data = await getData(params.slug);

    if (!data) {
        notFound();
    }

    const { count, path, time } = data;

    return <CommonAppPage count={count} path={path} revalidateAfter={revalidate * 1000} time={time} />;
}
