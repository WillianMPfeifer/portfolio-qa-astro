import type { Page } from '@playwright/test';

export class ProjectDetailPageElements {
  constructor(private readonly page: Page) {}

  get heading() {
    return this.page.getByRole('heading', { level: 1 });
  }
}
