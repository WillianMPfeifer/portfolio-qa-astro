import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { crawlSite, type CrawlResult } from '../support/crawler';

const { Given, Then } = createBdd();

let crawlResult: CrawlResult;

Given('the site has been crawled from the home page', async ({ page, baseURL }) => {
  crawlResult = await crawlSite(page, baseURL ?? 'http://localhost:4321');
});

Then('every internal route that was found responds with an ok status', () => {
  const failed = crawlResult.routes.filter((route) => !route.ok);
  expect(failed, `Routes that did not respond ok: ${JSON.stringify(failed)}`).toEqual([]);
});

Then('every internal link that was found points to an ok response', () => {
  const broken = crawlResult.links.filter((link) => !link.ok);
  expect(broken, `Broken links: ${JSON.stringify(broken)}`).toEqual([]);
});
