import { notFound } from 'next/navigation';
import { CommonAppPage } from 'cache-testing/utils/common-app-page';
import { createGetData } from 'cache-testing/utils/create-get-data';

type PageParams = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

const revalidate = 5;

const getData = createGetData('app/with-params/dynamic-true', revalidate);

export function generateStaticParams(): Promise<
  {
    slug: string;
  }[]
> {
  return Promise.resolve([
    { slug: '200' },
    { slug: '404' },
    { slug: 'alternate-200-404' },
  ]);
}

export default async function Index({
  params,
}: PageParams): Promise<React.ReactNode> {
  const resolvedParams = await params;
  const data = await getData(resolvedParams.slug);

  if (!data) {
    notFound();
  }

  const { count, path, time } = data;

  return (
    <CommonAppPage
      count={count}
      path={path}
      revalidateAfter={revalidate * 1000}
      time={time}
    />
  );
}
