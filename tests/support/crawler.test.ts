import { describe, expect, it } from 'vitest';
import { crawlSite } from './crawler';

interface FakeRoute {
  status: number;
  hrefs: string[];
}

function createFakePage(routes: Record<string, FakeRoute>) {
  const requestedUrls: string[] = [];

  const page = {
    async goto(url: string) {
      const path = new URL(url).pathname;
      const route = routes[path];
      requestedUrls.push(url);
      const status = route?.status ?? 404;
      return { status: () => status, ok: () => status < 400 };
    },
    async $$eval(_selector: string, _fn: unknown) {
      const lastUrl = requestedUrls[requestedUrls.length - 1];
      const path = new URL(lastUrl).pathname;
      return routes[path]?.hrefs ?? [];
    },
    request: {
      async get(url: string) {
        const path = new URL(url).pathname;
        const status = routes[path]?.status ?? 404;
        return { status: () => status, ok: () => status < 400 };
      },
    },
  };

  return page;
}

describe('crawlSite', () => {
  it('discovers every route reachable by internal links, following them transitively', async () => {
    const baseUrl = 'http://localhost:4321';
    const page = createFakePage({
      '/': { status: 200, hrefs: ['/projects/', 'https://external.example/'] },
      '/projects/': { status: 200, hrefs: ['/projects/case-a/', '/'] },
      '/projects/case-a/': { status: 200, hrefs: ['/'] },
    });

    const result = await crawlSite(page as any, baseUrl);

    expect(result.routes.map((route) => route.path).sort()).toEqual(
      ['/', '/projects/', '/projects/case-a/'].sort(),
    );
  });

  it('records a broken internal link without following external links', async () => {
    const baseUrl = 'http://localhost:4321';
    const page = createFakePage({
      '/': { status: 200, hrefs: ['/missing/', 'https://external.example/'] },
      '/missing/': { status: 404, hrefs: [] },
    });

    const result = await crawlSite(page as any, baseUrl);

    const brokenLink = result.links.find((link) => link.href === '/missing/');
    expect(brokenLink?.ok).toBe(false);
    expect(result.links.some((link) => link.href.includes('external.example'))).toBe(false);
  });
});
