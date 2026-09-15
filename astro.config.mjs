import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Willian — Docs',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        pt: { label: 'Português', lang: 'pt' },
      },
      sidebar: [
        { label: 'Web', items: [{ autogenerate: { directory: 'docs/web' } }] },
        { label: 'Mobile', items: [{ autogenerate: { directory: 'docs/mobile' } }] },
        { label: 'Processo', items: [{ autogenerate: { directory: 'docs/processo' } }] },
      ],
      customCss: [
        './src/styles/tokens.css',
        './src/styles/starlight-tokens.css',
        '@fontsource-variable/archivo/standard.css',
        '@fontsource/newsreader/400.css',
        '@fontsource/jetbrains-mono/400.css',
      ],
    }),
  ],
});
