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
    webServer: ports.map((port) => ({
        command: `node .next/__instances/${port}/server.js`,
        url: `http://localhost:${port}`,
        reuseExistingServer: !process.env.CI,
        env: { PORT: port, HOSTNAME: 'localhost', SERVER_STARTED: '1' },
        stdout: process.env.CI ? 'ignore' : 'pipe',
        stderr: 'pipe',
    })),
});
