import { test, expect } from '@playwright/test';

const urls = [
    '/pages/with-paths/fallback-blocking/200',
    '/pages/with-paths/fallback-true/200',
    '/pages/with-paths/fallback-false/200',
    '/pages/no-paths/fallback-blocking/200',
    '/pages/no-paths/fallback-true/200',
    // '/pages/no-paths/fallback-false/200', // this fails in native next.js cache
];

for (const url of urls) {
    test(`testing ${url.split('/').join(' ')}`, async ({ page }) => {
        await page.goto(url);

        await page.getByTestId('revalidate-button-path').click();

        await expect(page.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

        await page.reload();

        let val = (await page.getByTestId('data').innerText()).valueOf();

        await page.reload();

        // Page should not have changed after reload if revalidation button was not clicked

        await expect(page.getByTestId('data')).toHaveText(val);

        // Click on revalidate by path button

        await page.getByTestId('revalidate-button-path').click();

        await expect(page.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

        await page.reload();

        // Page should have changed after reload if revalidation button was clicked

        await expect(page.getByTestId('data')).not.toHaveText(val);

        val = (await page.getByTestId('data').innerText()).valueOf();

        await page.reload();

        // Page should not have changed after reload if revalidation button was not clicked

        await expect(page.getByTestId('data')).toHaveText(val);
    });
}
