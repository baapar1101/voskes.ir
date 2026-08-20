// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },

  vite: {
    server: {
      host: '0.0.0.0',
      allowedHosts: [
        'voskes.ir',
        'www.voskes.ir',
        'dev.voskes.ir'
      ],
    },
  },
});
