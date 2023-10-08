/* eslint-disable no-console -- it's a config file */
import { spawn } from 'node:child_process';
import { defineConfig } from 'tsup';

function onSuccess(): Promise<() => void> {
    const process = spawn('./dist/backend.mjs', { stdio: 'inherit' });

    process.on('error', (error) => {
        console.log(`backend error: ${error.message}`);
    });

    process.on('exit', (code) => {
        console.log(`backend off. Code ${code}`);
    });

    return new Promise<() => void>((res) => {
        res(() => {
            process.kill();
        });
    });
}

export const tsup = defineConfig((options) => {
    return {
        name: 'Build backend',
        entry: ['src/backend.ts'],
        splitting: false,
        clean: true,
        outDir: 'dist',
        format: 'esm',
        target: 'node18.17',
        onSuccess: options.watch ? onSuccess : undefined,
    };
});
