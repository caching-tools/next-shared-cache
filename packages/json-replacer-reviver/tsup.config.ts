import { defineConfig } from 'tsup';

export const tsup = defineConfig({
    name: 'Build json-replacer-reviver',
    entry: ['src/json-replacer-reviver.ts'],
    splitting: false,
    outDir: 'dist',
    clean: true,
    format: ['cjs', 'esm'],
    dts: true,
    target: 'node18',
});
