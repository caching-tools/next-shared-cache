import { defineConfig } from 'tsup';

export const tsup = defineConfig({
    name: 'Build diffscribe',
    entry: ['src/diffscribe.ts'],
    splitting: false,
    clean: true,
    outDir: 'dist',
    format: 'esm',
    target: 'node18',
});
