import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ProjectDetailPageElements } from '../elements/ProjectDetailPage.elements';

export class ProjectDetailPage extends BasePage {
  readonly elements: ProjectDetailPageElements;

  constructor(page: Page) {
    super(page);
    this.elements = new ProjectDetailPageElements(page);
  }

  async switchToPortuguese(): Promise<void> {
    await this.languageLinkPt.click();
  }

  async getTitle(): Promise<string | null> {
    return this.elements.heading.textContent();
  }
}
