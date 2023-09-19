import { defineConfig } from 'tsup';

export const tsup = defineConfig({
    name: 'Build handler',
    entry: ['src/handler.ts'],
    splitting: false,
    outDir: 'dist',
    clean: true,
    format: 'cjs',
    dts: true,
    target: 'node18.17',
    noExternal: ['undici'],
});
