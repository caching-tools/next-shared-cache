import { RestartButton } from 'cache-testing/components/restart-button';
import { RevalidateButton } from 'cache-testing/components/revalidate-button';
import type { PropsWithChildren } from 'react';
import 'cache-testing/globals.css';

export default function Layout({
  children,
}: PropsWithChildren): React.ReactNode {
  return (
    <main>
      {children}
      <RevalidateButton nextApi="pages" type="path" />
      <RestartButton />
    </main>
  );
}
