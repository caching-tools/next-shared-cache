import type { JSX, PropsWithChildren } from 'react';
import { Suspense } from 'react';

import { RestartButton } from 'cache-testing-15-app/components/restart-button';
import { RevalidateButton } from 'cache-testing-15-app/components/revalidate-button';
import 'cache-testing-15-app/globals.css';

export const metadata = {
    title: 'Cache testing app',
    description: '',
};

export default function RootLayout({ children }: PropsWithChildren): JSX.Element {
    return (
        <html lang="en">
            <body>
                {children}
                <Suspense fallback={null}>
                    <RevalidateButton nextApi="app" type="path" />
                    <RevalidateButton nextApi="app" type="tag" />
                    <RestartButton />
                </Suspense>
            </body>
        </html>
    );
}
