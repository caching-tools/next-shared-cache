import { defineConfig } from 'tsup';

export const tsup = defineConfig(() => {
    return {
        name: 'Build server',
        entry: ['src/server.ts', 'src/types.ts'],
        splitting: false,
        dts: true,
        clean: true,
        outDir: 'dist',
        format: 'esm',
        target: 'node18',
        noExternal: ['@repo/next-lru-cache/string'],
    };
});
