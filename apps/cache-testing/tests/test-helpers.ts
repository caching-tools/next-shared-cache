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
    }

    await page.reload();
}
