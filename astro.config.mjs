// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://realozk.github.io',
  base: '/CS-Vault/',
  prefetch: false,
  devToolbar: {
    enabled: false,
  },
  build: {
    inlineStylesheets: 'always',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  vite: {
    plugins: [tailwindcss()],
    css: {
      devSourcemap: false,
    },
  }
});
