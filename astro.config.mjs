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
        { label: 'Web', items: [{ autogenerate: { directory: 'web' } }] },
        { label: 'Mobile', items: [{ autogenerate: { directory: 'mobile' } }] },
        { label: 'Processo', items: [{ autogenerate: { directory: 'processo' } }] },
      ],
    }),
  ],
});
