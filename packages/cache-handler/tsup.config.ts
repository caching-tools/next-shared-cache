import { defineConfig } from 'tsup';

export const tsup = defineConfig({
    name: 'Build cache-handler',
    entry: ['src/cache-handler.ts'],
    splitting: false,
    outDir: 'dist',
    clean: false,
    format: 'cjs',
    dts: true,
    target: 'node18.17',
    external: ['lru-cache'],
});
