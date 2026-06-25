// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // TODO: Replace with your actual GitHub username, e.g., 'https://john-doe.github.io'
  site: 'https://realozk.github.io',
  // TODO: Replace with your actual GitHub repository name, e.g., '/my-repo-name'
  base: '/CS-Vault',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
});