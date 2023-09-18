import { spawn } from 'node:child_process';
import { defineConfig } from 'tsup';

function onSuccess(): Promise<() => void> {
    const process = spawn('./dist/backend.mjs');

    process.stdout.on('data', (chunk) => {
        console.log(String(chunk));
    });

    process.stderr.on('data', (chunk) => {
        console.log(String(chunk));
    });

    process.on('error', (error) => {
        console.log(`dev server error: ${error.message}`);
    });

    process.on('close', (code) => {
        console.log(`dev server is off. Code ${code}`);
    });

    process.on('exit', (code) => {
        console.log(`dev server is off. Code ${code}`);
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
