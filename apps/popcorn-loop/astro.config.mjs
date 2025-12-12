// @ts-check
import { defineConfig } from 'astro/config';
import UnoCSS from 'unocss/astro'
import cloudflare from '@astrojs/cloudflare';
import solidJs from '@astrojs/solid-js';
import clerk from '@clerk/astro'
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({

  adapter: cloudflare(),
  output: 'server',
  integrations: [
    clerk(), 
    solidJs(), 
    UnoCSS(), 
    react()],
  outDir: '../../dist/popcorn-loop',
   vite: {
    server: {
      watch: {
        // More aggressive ignore patterns
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/.astro/**',
          '**/playwright-report/**',
          '**/.wrangler/**',
          '**/coverage/**',
        ],
        // Use polling as fallback (slower but more reliable)
        usePolling: false,
        // Reduce max files watched
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 100
        }
      },
      fs: {
        // Strict file system access
        strict: true,
        allow: [
          `${import.meta.env.HOME}/projects/popcorn-loop`,
        ]
      }
    },
    resolve: {
      alias: {
        '@workspace/shared/types': `${import.meta.env.HOME}/projects/popcorn-loop/packages/shared/types/index.ts`,
        '@workspace/shared-validators': `${import.meta.env.HOME}/projects/popcorn-loop/packages/shared/validators/index.ts`,
        '@workspace/shared-utils': `${import.meta.env.HOME}/projects/popcorn-loop/packages/shared/utils/index.ts`,
      },
    },
  },
});