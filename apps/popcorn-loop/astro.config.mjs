// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  integrations: [solidJs()],
  outDir: '../../dist/popcorn-loop',
  vite: {
    resolve: {
      alias: {
        '@workspace/shared-types': '/home/jam/projects/popcorn-loop/packages/shared/types/src/index.ts',
        '@workspace/shared-validators': '/home/jam/projects/popcorn-loop/packages/shared/validators/src/index.ts',
        '@workspace/shared-utils': '/home/jam/projects/popcorn-loop/packages/shared/utils/src/index.ts',
      },
    },
  },
});