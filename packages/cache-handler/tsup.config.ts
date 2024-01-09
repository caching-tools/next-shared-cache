import { defineConfig } from 'tsup';

export const tsup = defineConfig({
    name: 'Build cache-handler',
    entry: ['src/cache-handler.ts', 'src/handlers/*.ts', 'src/helpers/helpers.ts'],
    splitting: false,
    outDir: 'dist',
    clean: false,
    format: ['cjs'],
    dts: { resolve: true },
    target: 'node18',
    noExternal: ['@neshca/json-replacer-reviver', 'lru-cache'],
});
