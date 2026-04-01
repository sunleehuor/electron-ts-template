import { defineConfig } from 'tsup';
import { resolve } from 'path';

export default defineConfig([
  {
    entry: { preload: 'electron/src/preload/preload.ts' },
    outDir: 'dist/electron/src/preload',
    format: ['cjs'],
    bundle: true,
    external: ['electron'],
    esbuildOptions(options) {
      options.alias = {
        '@shared': resolve(__dirname, 'shared'),
        '@': resolve(__dirname, 'electron/src'),
      };
    },
  },
  {
    entry: { main: 'electron/src/main.ts' },
    outDir: 'dist/electron/src',
    format: ['cjs'],
    bundle: true,
    external: ['electron'],
    esbuildOptions(options) {
      options.alias = {
        '@shared': resolve(__dirname, 'shared'), // ← use esbuildOptions
        '@': resolve(__dirname, 'electron/src'),
      };
    },
  },
]);
