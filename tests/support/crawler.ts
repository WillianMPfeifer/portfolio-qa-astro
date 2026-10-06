import type { Page } from '@playwright/test';

export interface RouteCheck {
  path: string;
  status: number;
  ok: boolean;
}

export interface LinkCheck {
  from: string;
  href: string;
  status: number;
  ok: boolean;
}

export interface CrawlResult {
  routes: RouteCheck[];
  links: LinkCheck[];
}

const SKIPPED_HREF_PREFIXES = ['#', 'mailto:', 'tel:'];

// Arquivos (PDF, imagem...) têm o link checado, mas não são abertos como página:
// page.goto num PDF vira download e não tem HTML pra seguir.
function isPagePath(pathname: string): boolean {
  const lastSegment = pathname.split('/').pop() ?? '';
  return !lastSegment.includes('.') || lastSegment.endsWith('.html');
}

export async function crawlSite(page: Page, baseUrl: string): Promise<CrawlResult> {
  const origin = new URL(baseUrl).origin;
  const visited = new Set<string>();
  const queue: string[] = ['/'];
  const routes: RouteCheck[] = [];
  const links: LinkCheck[] = [];

  while (queue.length > 0) {
    const path = queue.shift() as string;
    if (visited.has(path)) continue;
    visited.add(path);

    const pageUrl = new URL(path, baseUrl).toString();
    const response = await page.goto(pageUrl);
    routes.push({
      path,
      status: response?.status() ?? 0,
      ok: response?.ok() ?? false,
    });

    const hrefs = await page.$$eval('a[href]', (anchors) =>
      anchors.map((anchor) => anchor.getAttribute('href')).filter((href): href is string => href !== null),
    );

    for (const href of hrefs) {
      if (SKIPPED_HREF_PREFIXES.some((prefix) => href.startsWith(prefix))) continue;

      const resolved = new URL(href, pageUrl);
      if (resolved.origin !== origin) continue;

      const linkResponse = await page.request.get(resolved.toString());
      links.push({
        from: path,
        href,
        status: linkResponse.status(),
        ok: linkResponse.ok(),
      });

      const normalizedPath = resolved.pathname + resolved.search;
      if (isPagePath(resolved.pathname) && !visited.has(normalizedPath) && !queue.includes(normalizedPath)) {
        queue.push(normalizedPath);
      }
    }
  }

  return { routes, links };
}
