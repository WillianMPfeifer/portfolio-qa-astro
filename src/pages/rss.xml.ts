import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getProjectsByLang, projectHref } from '../utils/projectList';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const allProjects = await getCollection('projects');
  const projects = getProjectsByLang(allProjects, 'en');

  return rss({
    title: 'Willian — Projects',
    description: 'Real QA automation case studies.',
    site: context.site ?? 'https://portfolio-qa-astro.pages.dev',
    items: projects.map((project) => ({
      title: project.data.title,
      description: project.data.outcome,
      pubDate: project.data.date,
      link: projectHref(project),
    })),
  });
}
