import { unstable_cacheTag as cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CacheStateWatcher } from 'cache-testing/components/cache-state-watcher';
import { PreRenderedAt } from 'cache-testing/components/pre-rendered-at';
import type { RandomHexPageProps } from 'cache-testing/utils/types';

const lengthSteps = new Array(5).fill(0).map((_, i) => 10 ** (i + 1));

type PageParams = { params: Promise<{ length: string }> };

export function generateStaticParams(): Promise<
  {
    length: string;
  }[]
> {
  return Promise.resolve(
    lengthSteps.map((length) => ({ length: `${length}` })),
  );
}

export default async function Page({
  params,
}: PageParams): Promise<React.ReactNode> {
  'use cache';

  const resolvedParams = await params;
  const { length } = resolvedParams;
  const path = `/randomHex/app/${length}`;

  cacheTag(`/app/randomHex/${length}`);

  const url = new URL(path, 'http://localhost:8081');

  const result = await fetch(url);

  if (!result.ok) {
    notFound();
  }

  const props = (await result.json()) as RandomHexPageProps;

  return (
    <div>
      <div data-pw="random-hex">{props.randomHex}</div>
      <PreRenderedAt time={props.unixTimeMs} />
      <Suspense fallback={null}>
        <CacheStateWatcher
          revalidateAfter={Number.POSITIVE_INFINITY}
          time={props.unixTimeMs}
        />
      </Suspense>
    </div>
  );
}
