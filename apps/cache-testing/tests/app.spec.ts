import { test, expect } from '@playwright/test';

const urls = [
    '/app/with-params/dynamic-true/200',
    // '/app/with-params/dynamic-false/200', // this fails in native next.js cache
    '/app/no-params/dynamic-true/200',
    '/app/no-params/dynamic-false/200',
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

        // Tag revalidation button

        // Click on revalidate by tag button

        await page.getByTestId('revalidate-button-tag').click();

        await expect(page.getByTestId('is-revalidated-by-tag')).toContainText('Revalidated at');

        await page.reload();

        // Page should have changed after reload if revalidation button was clicked

        await expect(page.getByTestId('data')).not.toHaveText(val);

        val = (await page.getByTestId('data').innerText()).valueOf();

        await page.reload();

        // Page should not have changed after reload if revalidation button was not clicked

        await expect(page.getByTestId('data')).toHaveText(val);
    });
}
