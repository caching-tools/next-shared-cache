import { notFound } from 'next/navigation';
import { CommonAppPage } from 'cache-testing/utils/common-app-page';
import { createGetData } from 'cache-testing/utils/create-get-data';

const getData = createGetData('app/no-params/ssr', 0);

export default async function Index(): Promise<React.ReactNode> {
  const data = await getData('200');

  if (!data) {
    notFound();
  }

  const { count, path, time } = data;

  return (
    <CommonAppPage
      count={count}
      path={path}
      revalidateAfter={Number.POSITIVE_INFINITY}
      time={time}
    />
  );
}
