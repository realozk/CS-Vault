// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import summaryMarkdown from './src/lib/summary-markdown.mjs';

export default defineConfig({
  site: 'https://realozk.github.io',
  base: '/CS-Vault/',
  // Retain the established Markdown and inline-whitespace behavior on Astro 7.
  compressHTML: true,
  markdown: {
    processor: unified({ rehypePlugins: [summaryMarkdown] }),
  },
  prefetch: false,
  devToolbar: {
    enabled: false,
  },
  build: {
    inlineStylesheets: 'auto',
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
