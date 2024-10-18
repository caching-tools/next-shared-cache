import Timers from 'node:timers/promises';
import { expect, test } from '@playwright/test';
import { revalidateByApi } from './test-helpers';

const paths = [
    '/pages/with-paths/fallback-blocking/200',
    '/pages/with-paths/fallback-true/200',
    '/pages/with-paths/fallback-false/200',
    '/pages/no-paths/fallback-blocking/200',
    '/pages/no-paths/fallback-true/200',
    // '/pages/no-paths/fallback-false/200', // this fails with native next.js cache
];

test.describe('On-demand revalidation', () => {
    for (const path of paths) {
        test(`If revalidate is clicked, then page should be fresh after reload ${path}`, async ({ page, baseURL }) => {
            const url = new URL(path, `${baseURL}:3000`);

            await page.goto(url.href);

            await page.getByTestId('revalidate-button-path').click();

            await expect(page.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await page.reload();

            let pageValue = (await page.getByTestId('data').innerText()).valueOf();

            await page.reload();

            await expect(page.getByTestId('data')).toHaveText(pageValue);

            await page.getByTestId('revalidate-button-path').click();

            await expect(page.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await page.reload();

            await expect(page.getByTestId('data')).not.toHaveText(pageValue);

            pageValue = (await page.getByTestId('data').innerText()).valueOf();

            await page.reload();

            await expect(page.getByTestId('data')).toHaveText(pageValue);
        });
    }

    for (const path of paths) {
        test(`If revalidate is clicked on page A, then page B should be fresh on load ${path}`, async ({
            context,
            baseURL,
        }) => {
            const appAUrl = new URL(path, `${baseURL}:3000`);

            const appA = await context.newPage();

            await appA.goto(appAUrl.href);

            await appA.getByTestId('revalidate-button-path').click();

            await expect(appA.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            const appBUrl = new URL(path, `${baseURL}:3001`);

            const appB = await context.newPage();

            await appB.goto(appBUrl.href);

            const valueFromPageA = Number.parseInt((await appA.getByTestId('data').innerText()).valueOf(), 10);

            const valueFromPageB = Number.parseInt((await appB.getByTestId('data').innerText()).valueOf(), 10);

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

            await expect(page.getByTestId('data')).toHaveText(pageValue);

            await expect(page.getByTestId('cache-state')).toContainText('stale', { timeout: 7500 });

            await page.reload();

            await expect(page.getByTestId('data')).toHaveText(pageValue);

            await page.reload();

            await expect(page.getByTestId('data')).not.toHaveText(pageValue);
        });
    }

    for (const path of paths) {
        test(`Page should be fresh after reloaded once if becoming stale and waiting the same time for cache expiration ${path}`, async ({
            page,
            baseURL,
        }) => {
            test.fail(path.includes('fallback-false'), 'See https://github.com/vercel/next.js/issues/58094');

            const url = new URL(path, `${baseURL}:3000`);

            const startTime = Date.now();

            await page.goto(url.href);

            await page.getByTestId('revalidate-button-path').click();

            await expect(page.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await page.reload();

            const pageValue = (await page.getByTestId('data').innerText()).valueOf();

            await page.reload();

            await expect(page.getByTestId('data')).toHaveText(pageValue);

            await expect(page.getByTestId('cache-state')).toContainText('stale', { timeout: 7500 });

            const elapsedTime = Date.now() - startTime;

            await Timers.scheduler.wait(elapsedTime);

            await page.reload();

            await expect(page.getByTestId('data')).not.toHaveText(pageValue);
        });
    }

    for (const path of paths) {
        test(`If page A is stale, then page B should be fresh after load and reload ${path}`, async ({
            context,
            baseURL,
        }) => {
            const appA = await context.newPage();

            const appAUrl = new URL(path, `${baseURL}:3000`);

            await appA.goto(appAUrl.href);

            await appA.getByTestId('revalidate-button-path').click();

            await expect(appA.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await appA.reload();

            await expect(appA.getByTestId('cache-state')).toContainText('stale', { timeout: 7500 });

            const appB = await context.newPage();

            const appBUrl = new URL(path, `${baseURL}:3001`);

            await appB.goto(appBUrl.href);

            await expect(appB.getByTestId('cache-state')).toContainText('stale', { timeout: 7500 });

            await appB.reload();

            const valueFromPageA = Number.parseInt((await appA.getByTestId('data').innerText()).valueOf(), 10);

            const valueFromPageB = Number.parseInt((await appB.getByTestId('data').innerText()).valueOf(), 10);

            expect(valueFromPageA + 1 === valueFromPageB).toBe(true);
        });
    }

    for (const path of paths) {
        test(`If page A is stale and reloaded, then page B should be fresh after load ${path}`, async ({
            context,
            baseURL,
        }) => {
            const appAUrl = new URL(path, `${baseURL}:3000`);

            const appA = await context.newPage();

            await appA.goto(appAUrl.href);

            await appA.getByTestId('revalidate-button-path').click();

            await expect(appA.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await appA.reload();

            await expect(appA.getByTestId('cache-state')).toContainText('stale', { timeout: 7500 });

            await appA.reload();

            await appA.reload();

            const appB = await context.newPage();

            const appBUrl = new URL(path, `${baseURL}:3001`);

            await appB.goto(appBUrl.href);

            const valueFromPageA = Number.parseInt((await appA.getByTestId('data').innerText()).valueOf(), 10);

            const valueFromPageB = Number.parseInt((await appA.getByTestId('data').innerText()).valueOf(), 10);

            expect(valueFromPageA === valueFromPageB).toBe(true);
        });
    }
});

test.describe('Data consistency between two app instances for the same page', () => {
    for (const path of paths) {
        test(`Should be maintained when loaded at the same time ${path}`, async ({ context, baseURL }) => {
            const appAUrl = new URL(path, `${baseURL}:3000`);
            const appBUrl = new URL(path, `${baseURL}:3001`);

            const appA = await context.newPage();
            const appB = await context.newPage();

            await appA.goto(appAUrl.href);
            await appB.goto(appBUrl.href);

            await appA.getByTestId('revalidate-button-path').click();

            await expect(appA.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await appA.reload();
            await appB.reload();

            const valueFromPageA = Number.parseInt((await appA.getByTestId('data').innerText()).valueOf(), 10);

            const valueFromPageB = Number.parseInt((await appB.getByTestId('data').innerText()).valueOf(), 10);

            expect(valueFromPageA === valueFromPageB).toBe(true);
        });
    }
});

test.describe('Data consistency after server restart', () => {
    for (const path of paths) {
        test(`Should be maintained between App A and App B after App B server restarts ${path}`, async ({
            context,
            baseURL,
        }) => {
            const appAUrl = new URL(path, `${baseURL}:3000`);
            const appBUrl = new URL(path, `${baseURL}:3001`);

            const appA = await context.newPage();
            const appB = await context.newPage();

            await appA.goto(appAUrl.href);
            await appB.goto(appBUrl.href);

            await appA.getByTestId('revalidate-button-path').click();

            await expect(appA.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

            await appA.reload();
            await appB.reload();

            let valueFromPageA = Number.parseInt((await appA.getByTestId('data').innerText()).valueOf(), 10);

            const valueFromPageB = Number.parseInt((await appB.getByTestId('data').innerText()).valueOf(), 10);

            expect(valueFromPageA === valueFromPageB).toBe(true);

            const restartResult = await fetch(`${baseURL}:9000/restart/${appBUrl.port}`, {
                next: {
                    // @ts-expect-error -- act as an internal fetch call
                    internal: true,
                },
            });

            expect(restartResult.status).toBe(200);

            for await (const _ of [1, 2, 3]) {
                await appA.getByTestId('revalidate-button-path').click();

                await expect(appA.getByTestId('is-revalidated-by-path')).toContainText('Revalidated at');

                await appA.reload();
            }

            valueFromPageA = Number.parseInt((await appA.getByTestId('data').innerText()).valueOf(), 10);

            await appB.reload();

            const valueFromPageBAfterRestart = Number.parseInt(
                (await appB.getByTestId('data').innerText()).valueOf(),
                10,
            );

            expect(valueFromPageBAfterRestart === valueFromPageA).toBe(true);
        });
    }
});

test.describe('SSR', () => {
    test('verify initial cache state is fresh on SSR page load', async ({ page, baseURL }) => {
        const url = new URL('/pages/no-paths/ssr/200', `${baseURL}:3000`);

        await page.goto(url.href);

        await expect(page.getByTestId('cache-state')).toContainText('fresh');
    });

    test('ensure data value increments by 1 on SSR page reload', async ({ page, baseURL }) => {
        const url = new URL('/pages/no-paths/ssr/200', `${baseURL}:3000`);

        await page.goto(url.href);

        const valueFromPage = Number.parseInt((await page.getByTestId('data').innerText()).valueOf(), 10);

        await page.reload();

        const valueFromPageAfterReload = Number.parseInt((await page.getByTestId('data').innerText()).valueOf(), 10);

        expect(valueFromPageAfterReload - valueFromPage === 1).toBe(true);
    });
});

test.describe('SSR neshClassicCache', () => {
    const path = '/pages/no-paths/ssr-with-cache/200';

    test('If revalidate is called, then page should be fresh after reload', async ({ page, baseURL }) => {
        const url = new URL(path, `${baseURL}:3000`);

        await page.goto(url.href);

        const response = await revalidateByApi(path, `${baseURL}:3000`);

        expect(response.revalidated).toBe(true);

        await page.reload();

        await expect(page.getByTestId('cache-state')).toContainText('fresh');
    });

    test('If revalidate is called on page A, then page B should be fresh on load and value must be updated', async ({
        context,
        baseURL,
    }) => {
        const appAUrl = new URL(path, `${baseURL}:3000`);

        await revalidateByApi(path, `${baseURL}:3000`);

        const appA = await context.newPage();

        await appA.goto(appAUrl.href);

        await expect(appA.getByTestId('cache-state')).toContainText('fresh');

        const valueFromPageA = Number.parseInt((await appA.getByTestId('data').innerText()).valueOf(), 10);

        await revalidateByApi(path, `${baseURL}:3000`);

        const appBUrl = new URL(path, `${baseURL}:3001`);

        const appB = await context.newPage();

        await appB.goto(appBUrl.href);

        await expect(appA.getByTestId('cache-state')).toContainText('fresh');

        const valueFromPageB = Number.parseInt((await appB.getByTestId('data').innerText()).valueOf(), 10);

        expect(valueFromPageB - valueFromPageA === 1).toBe(true);
    });

    test('Page should be fresh after becoming stale and reloaded twice', async ({ page, baseURL }) => {
        const url = new URL(path, `${baseURL}:3000`);

        await revalidateByApi(path, `${baseURL}:3000`);

        await page.goto(url.href);

        await expect(page.getByTestId('cache-state')).toContainText('fresh');

        await expect(page.getByTestId('cache-state')).toContainText('stale', { timeout: 7500 });

        await page.reload();

        await expect(page.getByTestId('cache-state')).toContainText('stale');

        await page.reload();

        await expect(page.getByTestId('cache-state')).toContainText('fresh');
    });
});

test.describe('API route neshClassicCache', () => {
    const path = '/api/pages-cached-api';

    test('If revalidate is called, then page should be fresh after reload', async ({ baseURL }) => {
        const url = new URL(path, `${baseURL}:3000`);

        const revalidateByApiResponse = await revalidateByApi(path, `${baseURL}:3000`);

        expect(revalidateByApiResponse.revalidated).toBe(true);

        const response = await fetch(url.href);

        if (!response.ok) {
            throw new Error('Failed to fetch');
        }

        const json = (await response.json()) as { props: { count: number; timeMs: string; revalidateAfterMs: string } };

        const time = Number.parseInt(json.props.timeMs, 10);

        const revalidateAfter = Number.parseInt(json.props.revalidateAfterMs, 10);

        expect(time < revalidateAfter).toBe(true);
    });

    test('If revalidate is called on page A, then page B should be fresh on load and value must be updated', async ({
        baseURL,
    }) => {
        const appAUrl = new URL(path, `${baseURL}:3000`);

        const appBUrl = new URL(path, `${baseURL}:3001`);

        await revalidateByApi(path, `${baseURL}:3000`);

        const appAResponse = await fetch(appAUrl.href);

        if (!appAResponse.ok) {
            throw new Error('Failed to fetch');
        }

        const appAJson = (await appAResponse.json()) as {
            props: { count: number; timeMs: string; revalidateAfterMs: string };
        };

        const time = Number.parseInt(appAJson.props.timeMs, 10);

        const revalidateAfter = Number.parseInt(appAJson.props.revalidateAfterMs, 10);

        expect(time < revalidateAfter).toBe(true);

        const appACount = appAJson.props.count;

        await revalidateByApi(path, `${baseURL}:3000`);

        const appBResponse = await fetch(appBUrl.href);

        if (!appBResponse.ok) {
            throw new Error('Failed to fetch');
        }

        const appBJson = (await appBResponse.json()) as {
            props: { count: number; timeMs: string; revalidateAfterMs: string };
        };

        const appBCount = appBJson.props.count;

        expect(appBCount - appACount === 1).toBe(true);
    });

    test('Page should be fresh after becoming stale and reloaded twice', async ({ baseURL }) => {
        const url = new URL(path, `${baseURL}:3000`);

        await revalidateByApi(path, `${baseURL}:3000`);

        const response1 = await fetch(url.href);

        if (!response1.ok) {
            throw new Error('Failed to fetch');
        }

        const json1 = (await response1.json()) as {
            props: { count: number; timeMs: string; revalidateAfterMs: string };
        };

        const time = Number.parseInt(json1.props.timeMs, 10);

        const revalidateAfter = Number.parseInt(json1.props.revalidateAfterMs, 10);

        expect(time < revalidateAfter).toBe(true);

        await Timers.setTimeout(revalidateAfter - Date.now());

        await fetch(url.href);
        const response2 = await fetch(url.href);

        if (!response2.ok) {
            throw new Error('Failed to fetch');
        }

        const json2 = (await response2.json()) as {
            props: { count: number; timeMs: string; revalidateAfterMs: string };
        };

        expect(json2.props.count - json1.props.count === 1).toBe(true);
    });
});
