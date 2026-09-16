import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://portfolio-qa-astro.pages.dev',
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
      head: [
        // Starlight já emite twitter:card e outras tags og:* próprias — aqui só
        // completamos og:image/twitter:image, que faltam nas rotas /docs e /pt/docs
        // (BaseLayout.astro cobre as páginas do site, mas não as do Starlight).
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://portfolio-qa-astro.pages.dev/og-image.png',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image',
            content: 'https://portfolio-qa-astro.pages.dev/og-image.png',
          },
        },
      ],
    }),
  ],
});
