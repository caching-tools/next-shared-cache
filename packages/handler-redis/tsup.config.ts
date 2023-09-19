import { defineConfig } from 'tsup';

export const tsup = defineConfig({
    name: 'Build handler-redis',
    entry: ['src/handler-redis.ts'],
    splitting: false,
    outDir: 'dist',
    clean: true,
    format: 'cjs',
    dts: true,
    target: 'node18.17',
    noExternal: ['redis'],
});
