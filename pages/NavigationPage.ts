import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class NavigationPage extends BasePage {
    // Footer Service Links
    readonly applicationDevelopmentLink: Locator;
    readonly softwareTestingLink: Locator;
    readonly cloudComputingLink: Locator;
    readonly devOpsEngineeringLink: Locator;
    readonly businessProcessLink: Locator;
    readonly infrastructureServicesLink: Locator;
    readonly cyberSecurityLink: Locator;

    constructor(page: Page) {
        super(page);

        // Initialize Footer Service Links
        this.applicationDevelopmentLink = page.getByRole('link', { name: 'Application Development Services' });
        this.softwareTestingLink = page.getByRole('link', { name: 'Software Testing Services' });
        this.cloudComputingLink = page.getByRole('link', { name: 'Cloud Computing' });
        this.devOpsEngineeringLink = page.getByRole('link', { name: 'DevOps Engineering' });
        this.businessProcessLink = page.getByRole('link', { name: 'Business Process Services' });
        this.infrastructureServicesLink = page.getByRole('link', { name: 'Infrastructure Services' });
        this.cyberSecurityLink = page.getByRole('link', { name: 'Cyber Security' });
    }

    async clickApplicationDevelopment() {
        await this.applicationDevelopmentLink.click();
        await this.waitForPageLoad();
    }

    async clickSoftwareTesting() {
        await this.softwareTestingLink.click();
        await this.waitForPageLoad();
    }

    async clickCloudComputing() {
        await this.cloudComputingLink.click();
        await this.waitForPageLoad();
    }

    async clickDevOpsEngineering() {
        await this.devOpsEngineeringLink.click();
        await this.waitForPageLoad();
    }

    async clickBusinessProcess() {
        await this.businessProcessLink.click();
        await this.waitForPageLoad();
    }

    async clickInfrastructureServices() {
        await this.infrastructureServicesLink.click();
        await this.waitForPageLoad();
    }

    async clickCyberSecurity() {
        await this.cyberSecurityLink.click();
        await this.waitForPageLoad();
    }
}

