import { defineConfig } from 'tsup';

export const tsup = defineConfig(() => {
    return {
        name: 'Build next-types',
        entry: ['src/next-types.ts'],
        splitting: false,
        dts: true,
        clean: false,
        outDir: 'dist',
        format: 'esm',
        target: 'node18.17',
    };
});
