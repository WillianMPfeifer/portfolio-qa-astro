import type { Locator, Page } from '@playwright/test';

const BASE_PATH = '/portfolio-qa-astro';

export class BasePage {
  readonly page: Page;
  readonly themeToggleButton: Locator;
  readonly languageLinkPt: Locator;
  readonly languageLinkEn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.themeToggleButton = page.getByRole('button', { name: 'Toggle color theme' });
    this.languageLinkPt = page.getByRole('link', { name: 'pt', exact: true });
    this.languageLinkEn = page.getByRole('link', { name: 'en', exact: true });
  }

  async goto(path: string): Promise<void> {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const target = cleanPath.startsWith(BASE_PATH) ? cleanPath : `${BASE_PATH}${cleanPath}`;
    await this.page.goto(target);
  }

  async getTheme(): Promise<string | null> {
    return this.page.evaluate(() => document.documentElement.dataset.theme ?? null);
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggleButton.click();
  }
}
