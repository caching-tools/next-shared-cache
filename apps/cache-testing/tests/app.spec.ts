import { test, expect } from '@playwright/test';

const paths = [
    // '/app/with-params/dynamic-true/200', // this fails with native next.js cache
    // '/app/with-params/dynamic-false/200', // this fails with native next.js cache
    '/app/no-params/dynamic-true/200',
    '/app/no-params/dynamic-false/200',
];

test.describe('On-demand revalidation', () => {
    for (const path of paths) {
        test(`If revalidate by path or by tag is clicked, then page should be fresh after reload ${path}`, async ({
            page,
            baseURL,
        }) => {
            const url = new URL(path, `${baseURL}:3000`);

            await page.goto(url.href);

            await page.getByTestId('revalidate-button-path').click();

            await expect(page.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await page.reload();

            let pageValue = (await page.getByTestId('data').innerText()).valueOf();

            await page.reload();

            // Page should not have changed after reload if revalidation button was not clicked

            await expect(page.getByTestId('data')).toHaveText(pageValue);

            // Click on revalidate by path button

            await page.getByTestId('revalidate-button-path').click();

            await expect(page.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await page.reload();

            // Page should have changed after reload if revalidation button was clicked

            await expect(page.getByTestId('data')).not.toHaveText(pageValue);

            pageValue = (await page.getByTestId('data').innerText()).valueOf();

            await page.reload();

            // Page should not have changed after reload if revalidation button was not clicked

            await expect(page.getByTestId('data')).toHaveText(pageValue);

            // Tag revalidation button

            // Click on revalidate by tag button

            await page.getByTestId('revalidate-button-tag').click();

            await expect(page.getByTestId('is-revalidated-by-tag')).toContainText('Revalidated at');

            await page.reload();

            // Page should have changed after reload if revalidation button was clicked

            await expect(page.getByTestId('data')).not.toHaveText(pageValue);

            pageValue = (await page.getByTestId('data').innerText()).valueOf();

            await page.reload();

            // Page should not have changed after reload if revalidation button was not clicked

            await expect(page.getByTestId('data')).toHaveText(pageValue);
        });
    }

    for (const path of paths) {
        test(`If revalidate by path is clicked on page A, then page B should be fresh on load ${path}`, async ({
            context,
            baseURL,
        }) => {
            const pageAUrl = new URL(path, `${baseURL}:3000`);

            const pageA = await context.newPage();

            await pageA.goto(pageAUrl.href);

            await pageA.getByTestId('revalidate-button-path').click();

            await expect(pageA.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            const pageBUrl = new URL(path, `${baseURL}:3001`);

            const pageB = await context.newPage();

            await pageB.goto(pageBUrl.href);

            const valueFromPageA = Number.parseInt((await pageA.getByTestId('data').innerText()).valueOf(), 10);

            const valueFromPageB = Number.parseInt((await pageB.getByTestId('data').innerText()).valueOf(), 10);

            expect(valueFromPageA + 1 === valueFromPageB).toBe(true);
        });
    }

    for (const path of paths) {
        test(`If revalidate by tag is clicked on page A, then page B should be fresh on load ${path}`, async ({
            context,
            baseURL,
        }) => {
            const pageAUrl = new URL(path, `${baseURL}:3000`);

            const pageA = await context.newPage();

            await pageA.goto(pageAUrl.href);

            await pageA.getByTestId('revalidate-button-tag').click();

            await expect(pageA.getByTestId('is-revalidated-by-tag')).toContainText('Revalidated at');

            const pageBUrl = new URL(path, `${baseURL}:3001`);

            const pageB = await context.newPage();

            await pageB.goto(pageBUrl.href);

            const valueFromPageA = Number.parseInt((await pageA.getByTestId('data').innerText()).valueOf(), 10);

            const valueFromPageB = Number.parseInt((await pageB.getByTestId('data').innerText()).valueOf(), 10);

            expect(valueFromPageA + 1 === valueFromPageB).toBe(true);
        });
    }
});

test.describe('Time-based revalidation', () => {
    for (const path of paths) {
        test(`Page should be fresh after becoming stale and reloaded twice ${path}`, async ({ page, baseURL }) => {
            const url = new URL(path, `${baseURL}:3000`);

            await page.goto(url.href);

            await page.getByTestId('revalidate-button-path').click();

            await expect(page.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await page.reload();

            const pageValue = (await page.getByTestId('data').innerText()).valueOf();

            await page.reload();

            // Page should not have changed after reload if revalidation button was not clicked

            await expect(page.getByTestId('data')).toHaveText(pageValue);

            // wait for text in data-pw="cache-state" to change from "Cache state fresh" to "Cache state stale"

            await expect(page.getByTestId('cache-state')).toContainText('stale', { timeout: 15000 });

            // reload page twice to revalidate

            await page.reload();

            await expect(page.getByTestId('data')).toHaveText(pageValue);

            await page.reload();

            await expect(page.getByTestId('data')).not.toHaveText(pageValue);
        });
    }

    for (const path of paths) {
        test(`If page A is stale, then page B should be fresh after load and reload ${path}`, async ({
            context,
            baseURL,
        }) => {
            const pageA = await context.newPage();

            const pageAUrl = new URL(path, `${baseURL}:3000`);

            await pageA.goto(pageAUrl.href);

            await pageA.getByTestId('revalidate-button-path').click();

            await expect(pageA.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await pageA.reload();

            await expect(pageA.getByTestId('cache-state')).toContainText('stale', { timeout: 7500 });

            const pageB = await context.newPage();

            const pageBUrl = new URL(path, `${baseURL}:3001`);

            await pageB.goto(pageBUrl.href);

            await expect(pageB.getByTestId('cache-state')).toContainText('stale', { timeout: 7500 });

            await pageB.reload();

            const valueFromPageA = Number.parseInt((await pageA.getByTestId('data').innerText()).valueOf(), 10);

            const valueFromPageB = Number.parseInt((await pageB.getByTestId('data').innerText()).valueOf(), 10);

            expect(valueFromPageA + 1 === valueFromPageB).toBe(true);
        });
    }

    for (const path of paths) {
        test(`If page A is stale and reloaded, then page B should be fresh after load ${path}`, async ({
            context,
            baseURL,
        }) => {
            const pageAUrl = new URL(path, `${baseURL}:3000`);

            const pageA = await context.newPage();

            await pageA.goto(pageAUrl.href);

            await pageA.getByTestId('revalidate-button-path').click();

            await expect(pageA.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await pageA.reload();

            await expect(pageA.getByTestId('cache-state')).toContainText('stale', { timeout: 7500 });

            await pageA.reload();

            await pageA.reload();

            const pageB = await context.newPage();

            const pageBUrl = new URL(path, `${baseURL}:3001`);

            await pageB.goto(pageBUrl.href);

            const valueFromPageA = Number.parseInt((await pageA.getByTestId('data').innerText()).valueOf(), 10);

            const valueFromPageB = Number.parseInt((await pageA.getByTestId('data').innerText()).valueOf(), 10);

            expect(valueFromPageA === valueFromPageB).toBe(true);
        });
    }
});

test.describe('Cache should be shared between two app instances for the same page', () => {
    for (const path of paths) {
        test(`Page A and Page B should have the same data when loaded at the same time ${path}`, async ({
            context,
            baseURL,
        }) => {
            const pageAUrl = new URL(path, `${baseURL}:3000`);
            const pageBUrl = new URL(path, `${baseURL}:3001`);

            const pageA = await context.newPage();
            const pageB = await context.newPage();

            await pageA.goto(pageAUrl.href);
            await pageB.goto(pageBUrl.href);

            await pageA.getByTestId('revalidate-button-path').click();

            await expect(pageA.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await pageA.reload();
            await pageB.reload();

            const valueFromPageA = Number.parseInt((await pageA.getByTestId('data').innerText()).valueOf(), 10);

            const valueFromPageB = Number.parseInt((await pageB.getByTestId('data').innerText()).valueOf(), 10);

            expect(valueFromPageA === valueFromPageB).toBe(true);
        });
    }
});
