'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

type RevalidateButtonAppProps = {
    nextApi: 'app';
    type: 'path' | 'tag';
};

type RevalidateButtonPagesProps = {
    nextApi: 'pages';
    type: 'path';
};

export function RevalidateButton({
    nextApi,
    type,
}: RevalidateButtonAppProps | RevalidateButtonPagesProps): JSX.Element {
    const pathname = usePathname();

    const [revalidation, setRevalidation] = useState('');

    function handleRevalidation(): void {
        const searchParams = new URLSearchParams();

        if (pathname) {
            searchParams.set(type, pathname);
        }

        fetch(`/api/revalidate-${nextApi}?${searchParams.toString()}`).then(async (result) => {
            if (!result.ok) {
                setRevalidation('Fail to revalidate');

                return;
            }

            const json = (await result.json()) as { now: string };

            setRevalidation(`Revalidated at ${json.now}`);
        });
    }

    return (
        <div>
            <button data-pw={`revalidate-button-${type}`} onClick={handleRevalidation} type="button">
                Revalidate {type}
            </button>
            <div data-pw={`is-revalidated-by-${type}`}>{revalidation}</div>
        </div>
    );
}
