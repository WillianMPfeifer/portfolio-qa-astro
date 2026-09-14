import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';

const { Given, When, Then } = createBdd();

let homePage: HomePage;
let detailPage: ProjectDetailPage;

Given('I start from the home page', async ({ page }) => {
  homePage = new HomePage(page);
  await homePage.open('en');
});

When('I open the featured case study {string}', async ({ page }, title: string) => {
  await homePage.openFeaturedProject(title);
  detailPage = new ProjectDetailPage(page);
});

When('I switch the language to Portuguese', async () => {
  await detailPage.switchToPortuguese();
});

Then('I should land on the Portuguese case study {string}', async ({ page }, title: string) => {
  expect(await detailPage.getTitle()).toBe(title);
  await expect(page).toHaveURL(/\/pt\/projects\//);
});
