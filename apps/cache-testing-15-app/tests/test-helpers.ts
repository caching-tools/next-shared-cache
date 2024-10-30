import { type Page, expect } from '@playwright/test';

export async function revalidateByTag(page: Page) {
    await page.getByTestId('revalidate-button-tag').click();

    await expect(page.getByTestId('is-revalidated-by-tag')).toContainText('Revalidated at');
}

export async function revalidateByPath(page: Page) {
    await page.getByTestId('revalidate-button-path').click();

    await expect(page.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');
}

export async function refreshPageCache(page: Page, by: 'tag' | 'path') {
    switch (by) {
        case 'tag': {
            await revalidateByTag(page);
            break;
        }
        case 'path': {
            await revalidateByPath(page);
            break;
        }
        default: {
            throw new Error(`Invalid by: ${by}`);
        }
    }

    await page.reload();
}

export async function revalidateByApi(
    path: string,
    base: string,
    router: 'app' | 'pages' = 'app',
    by: 'path' | 'tag' = 'tag',
): Promise<{ revalidated: boolean; now: string }> {
    const url = new URL(`/api/revalidate-${router}`, base);

    url.searchParams.append(by, path);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to revalidate');
    }

    const json = (await response.json()) as { revalidated: boolean; now: string };

    if (!json.revalidated) {
        throw new Error('Failed to revalidate');
    }

    return json;
}
