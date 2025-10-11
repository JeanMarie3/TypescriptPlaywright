import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
    // Header Elements
    readonly logo: Locator;
    readonly navigation: Locator;

    // Navigation Links
    readonly homeLink: Locator;
    readonly technologiesLink: Locator;
    readonly trainingLink: Locator;
    readonly projectsLink: Locator;
    readonly servicesLink: Locator;
    readonly contactUsLink: Locator;

    // Contact Information
    readonly locationText: Locator;
    readonly emailText: Locator;
    readonly phoneText: Locator;
    readonly officeHoursText: Locator;

    // Hero Section
    readonly heroHeading: Locator;
    readonly itSolutionsHeading: Locator;
    readonly heroDescription: Locator;

    // About Us Section
    readonly aboutUsHeading: Locator;
    readonly aboutUsSubheading: Locator;
    readonly softwareDevelopmentHeading: Locator;
    readonly artificialIntelligenceHeading: Locator;
    readonly cloudComputingHeading: Locator;
    readonly cyberSecurityHeading: Locator;
    readonly devOpsHeading: Locator;

    // Services Section
    readonly ourServicesHeading: Locator;

    // FAQ Section
    readonly faqHeading: Locator;
    readonly faqSubheading: Locator;

    // Footer
    readonly aboutEducatifuHeading: Locator;
    readonly servicesHeading: Locator;
    readonly companyHeading: Locator;
    readonly contactUsHeading: Locator;
    readonly stayInTouchHeading: Locator;

    // Social Media Links
    readonly linkedinLink: Locator;

    constructor(page: Page) {
        super(page);

        // Initialize Header Elements
        this.logo = page.getByRole('img', { name: 'Logo' }).first();
        this.navigation = page.locator('navigation');

        // Initialize Navigation Links
        this.homeLink = page.getByRole('link', { name: 'Home' });
        this.technologiesLink = page.getByRole('link', { name: 'Technologies' });
        this.trainingLink = page.getByRole('link', { name: 'Training' });
        this.projectsLink = page.getByRole('link', { name: 'Projects' });
        this.servicesLink = page.getByRole('link', { name: 'Services' });
        this.contactUsLink = page.getByRole('link', { name: 'Contact Us' });

        // Initialize Contact Information
        this.locationText = page.getByText('Warsaw, Poland');
        this.emailText = page.getByText('services@dev.educatifu.com');
        this.phoneText = page.getByText('+48 728 495 231');
        this.officeHoursText = page.getByText('Office Hours: 8:00 AM – 6:00 PM');

        // Initialize Hero Section
        this.heroHeading = page.getByRole('heading', { name: 'Building better' });
        this.itSolutionsHeading = page.getByRole('heading', { name: /IT Solutions/ });
        this.heroDescription = page.getByText('When it comes to developing unique pieces of software,');

        // Initialize About Us Section
        this.aboutUsHeading = page.getByRole('heading', { name: 'About Us' });
        this.aboutUsSubheading = page.getByRole('heading', { name: 'We are a team of experienced and dedicated IT professionals' });
        this.softwareDevelopmentHeading = page.getByRole('heading', { name: 'Software Development' });
        this.artificialIntelligenceHeading = page.getByRole('heading', { name: 'Artificial Intelligence' });
        this.cloudComputingHeading = page.getByRole('heading', { name: 'Cloud Computing' });
        this.cyberSecurityHeading = page.getByRole('heading', { name: 'Cyber Security' });
        this.devOpsHeading = page.getByRole('heading', { name: 'DevOps' });

        // Initialize Services Section
        this.ourServicesHeading = page.getByRole('heading', { name: 'Our Services' });

        // Initialize FAQ Section
        this.faqHeading = page.getByRole('heading', { name: 'FAQ' });
        this.faqSubheading = page.getByRole('heading', { name: /Frequently Asked Questions/ });

        // Initialize Footer
        this.aboutEducatifuHeading = page.getByRole('heading', { name: 'About Educatifu' });
        this.servicesHeading = page.getByRole('heading', { name: 'Services' });
        this.companyHeading = page.getByRole('heading', { name: 'Company' });
        this.contactUsHeading = page.getByRole('heading', { name: 'Contact Us' });
        this.stayInTouchHeading = page.getByRole('heading', { name: 'Stay in Touch' });

        // Initialize Social Media Links
        this.linkedinLink = page.getByRole('link').filter({ has: page.locator('[href*="linkedin.com"]') });
    }

    async navigateToHome() {
        await this.navigate('/');
    }

    async clickTechnologies() {
        await this.technologiesLink.click();
        await this.waitForPageLoad();
    }

    async clickTraining() {
        await this.trainingLink.click();
        await this.waitForPageLoad();
    }

    async clickProjects() {
        await this.projectsLink.click();
        await this.waitForPageLoad();
    }

    async clickServices() {
        await this.servicesLink.click();
        await this.waitForPageLoad();
    }

    async clickContactUs() {
        await this.contactUsLink.click();
        await this.waitForPageLoad();
    }

    async getLinkedinUrl(): Promise<string | null> {
        return await this.linkedinLink.first().getAttribute('href');
    }

    getServiceHeading(serviceName: string): Locator {
        return this.page.getByRole('heading', { name: serviceName });
    }

    getFaqButtons(): Locator {
        return this.page.locator('button[aria-expanded]');
    }

    getStatisticValue(value: string): Locator {
        return this.page.getByText(value);
    }

    getStatisticDescription(description: string): Locator {
        return this.page.getByText(description);
    }
}
