import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://willianmpfeifer.github.io',
  base: '/portfolio-qa-astro',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    starlight({
      title: 'Willian — Docs',
      // Busca (Pagefind) desligada enquanto o /docs tem só uma página: são ~700 KB de build sem uso.
      // Quando tiver conteúdo, é só apagar esta linha.
      pagefind: false,
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
      // O Starlight não recebe o Tailwind (global.css), só os tokens: assim o preflight não quebra o /docs.
      customCss: [
        './src/styles/tokens.css',
        './src/styles/starlight-tokens.css',
        '@fontsource-variable/schibsted-grotesk/wght.css',
        '@fontsource-variable/martian-mono/wght.css',
      ],
    }),
  ],
});
