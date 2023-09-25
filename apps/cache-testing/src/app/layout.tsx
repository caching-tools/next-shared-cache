import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import { RevalidateButton } from '../components/revalidate-button';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Cache testing app',
    description: '',
};

export default function RootLayout({ children }): JSX.Element {
    return (
        <html lang="en">
            <body className={inter.className}>
                {children}
                <Suspense fallback={null}>
                    <RevalidateButton nextApi="app" type="path" />
                    <RevalidateButton nextApi="app" type="tag" />
                </Suspense>
            </body>
        </html>
    );
}
