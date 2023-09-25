import { test, expect } from '@playwright/test';

test('Click on-demand revalidation with-params', async ({ page }) => {
    await page.goto('http://localhost:3000/app/with-params/dynamic-true/200');

    let val = (await page.getByTestId('data').innerText()).valueOf();

    await page.reload();

    // Page should not have changed after reload if revalidation button was not clicked

    await expect(page.getByTestId('data')).toHaveText(val);

    // Click on revalidate by path button

    await page.getByTestId('revalidate-button-path').click();

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

    await page.reload();

    // Page should have changed after reload if revalidation button was clicked

    await expect(page.getByTestId('data')).not.toHaveText(val);

    val = (await page.getByTestId('data').innerText()).valueOf();

    await page.reload();

    // Page should not have changed after reload if revalidation button was not clicked

    await expect(page.getByTestId('data')).toHaveText(val);
});

test('Click on-demand revalidation no-params', async ({ page }) => {
    await page.goto('http://localhost:3000/app/no-params/dynamic-true/200');

    let val = (await page.getByTestId('data').innerText()).valueOf();

    await page.reload();

    // Page should not have changed after reload if revalidation button was not clicked

    await expect(page.getByTestId('data')).toHaveText(val);

    // Click on revalidate by path button

    await page.getByTestId('revalidate-button-path').click();

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

    await page.reload();

    // Page should have changed after reload if revalidation button was clicked

    await expect(page.getByTestId('data')).not.toHaveText(val);

    val = (await page.getByTestId('data').innerText()).valueOf();

    await page.reload();

    // Page should not have changed after reload if revalidation button was not clicked

    await expect(page.getByTestId('data')).toHaveText(val);
});
