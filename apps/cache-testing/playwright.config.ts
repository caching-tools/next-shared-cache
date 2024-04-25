import { defineConfig, devices } from '@playwright/test';

const ports = ['3000', '3001'];

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: 'html',
    use: { baseURL: 'http://localhost', trace: 'on-first-retry', testIdAttribute: 'data-pw' },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: `tsx ./run-app-instances.ts ports=${ports.join(',')}`,
        url: 'http://localhost:9000',
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
    },
});
