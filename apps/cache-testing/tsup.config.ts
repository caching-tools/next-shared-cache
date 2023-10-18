import { defineConfig } from 'tsup';

export const tsup = defineConfig(() => {
    return {
        name: 'Build orchestration',
        entry: ['src/utils/run-app-instances.ts'],
        splitting: false,
        dts: false,
        clean: true,
        outDir: 'dist',
        format: 'esm',
        target: 'node18',
        external: ['fastify', 'pm2'],
    };
});
