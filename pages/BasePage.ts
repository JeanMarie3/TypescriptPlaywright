import { Page, Locator } from '@playwright/test';

export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigate(url: string = '/') {
        await this.page.goto(url);
        await this.page.waitForLoadState('networkidle');
    }

    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
    }

    async scrollToElement(locator: Locator) {
        await locator.scrollIntoViewIfNeeded();
    }

    async getTitle(): Promise<string> {
        return await this.page.title();
    }

    async getURL(): Promise<string> {
        return this.page.url();
    }

    async waitForTimeout(milliseconds: number) {
        await this.page.waitForTimeout(milliseconds);
    }
}

