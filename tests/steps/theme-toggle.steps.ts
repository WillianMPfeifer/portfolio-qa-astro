import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

const { Given, When, Then } = createBdd();

let homePage: HomePage;
let initialTheme: string | null;
let toggledTheme: string | null;

Given('I am on the home page', async ({ page }) => {
  homePage = new HomePage(page);
  await homePage.open('en');
});

When('I note the current theme', async () => {
  initialTheme = await homePage.getTheme();
});

When('I toggle the theme', async () => {
  await homePage.toggleTheme();
});

Then('the theme should have changed', async () => {
  toggledTheme = await homePage.getTheme();
  expect(toggledTheme).not.toBe(initialTheme);
  expect(['light', 'dark']).toContain(toggledTheme);
});

When('I reload the page', async ({ page }) => {
  await page.reload();
});

Then('the theme should still be the toggled value', async () => {
  const themeAfterReload = await homePage.getTheme();
  expect(themeAfterReload).toBe(toggledTheme);
});
