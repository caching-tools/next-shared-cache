import { test, expect } from '@playwright/test';

test.describe('on-demand revalidation', () => {
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
});

test.describe('time based revalidation', () => {
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
            await page.goto('/pages/no-paths/fallback-blocking/200');

            await page.getByTestId('revalidate-button-path').click();

            await expect(page.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await page.reload();

            const val = (await page.getByTestId('data').innerText()).valueOf();

            await page.reload();

            // Page should not have changed after reload if revalidation button was not clicked

            await expect(page.getByTestId('data')).toHaveText(val);

            // wait for text in data-pw="cache-state" to change from "Cache state fresh" to "Cache state stale"

            await expect(page.getByTestId('cache-state')).toContainText('stale', { timeout: 15000 });

            // reload page twice to revalidate

            await page.reload();

            await expect(page.getByTestId('data')).toHaveText(val);

            await page.reload();

            await expect(page.getByTestId('data')).not.toHaveText(val);
        });
    }
});
