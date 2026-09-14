import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { HomePageElements } from '../elements/HomePage.elements';

export class HomePage extends BasePage {
  readonly elements: HomePageElements;

  constructor(page: Page) {
    super(page);
    this.elements = new HomePageElements(page);
  }

  async open(locale: 'en' | 'pt' = 'en'): Promise<void> {
    await this.goto(locale === 'pt' ? '/pt/' : '/');
  }

  async openFeaturedProject(title: string): Promise<void> {
    await this.elements.featuredProjectLink(title).click();
  }
}
