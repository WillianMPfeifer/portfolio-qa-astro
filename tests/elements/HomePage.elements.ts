import type { Page } from '@playwright/test';

export class HomePageElements {
  constructor(private readonly page: Page) {}

  featuredProjectLink(title: string) {
    return this.page.getByRole('link', { name: title });
  }
}
