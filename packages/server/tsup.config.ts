/* eslint-disable no-console -- it's a config file  */
import { spawn } from 'node:child_process';
import { defineConfig } from 'tsup';

function onSuccess(): Promise<() => void> {
    const process = spawn('./dist/server.mjs', { stdio: 'inherit' });

    process.on('error', (error) => {
        console.log(`server error: ${error.message}`);
    });

    process.on('exit', (code) => {
        console.log(`server is off. Code ${code}`);
    });

    return new Promise<() => void>((res) => {
        res(() => {
            process.kill();
        });
    });
}

export const tsup = defineConfig((options) => {
    return {
        name: 'Build server',
        entry: ['src/server.ts', 'src/types.ts'],
        splitting: false,
        dts: true,
        clean: true,
        outDir: 'dist',
        format: 'esm',
        target: 'node18.17',
        onSuccess: options.watch ? onSuccess : undefined,
    };
});
