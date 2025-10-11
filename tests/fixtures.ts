import { test as base } from '@playwright/test';
import { HomePage, ContactPage, NavigationPage } from '../pages';

type PageFixtures = {
    homePage: HomePage;
    contactPage: ContactPage;
    navigationPage: NavigationPage;
};

export const test = base.extend<PageFixtures>({
    homePage: async ({ page }, use) => {
        const homePage = new HomePage(page);
        await use(homePage);
    },
    contactPage: async ({ page }, use) => {
        const contactPage = new ContactPage(page);
        await use(contactPage);
    },
    navigationPage: async ({ page }, use) => {
        const navigationPage = new NavigationPage(page);
        await use(navigationPage);
    },
});

export { expect } from '@playwright/test';

