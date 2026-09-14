import type { Locator, Page } from '@playwright/test';

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
    await this.page.goto(path);
  }

  async getTheme(): Promise<string | null> {
    return this.page.evaluate(() => document.documentElement.dataset.theme ?? null);
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggleButton.click();
  }
}
