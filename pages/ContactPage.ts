import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ContactPage extends BasePage {
    // Contact Form Elements
    readonly contactFormHeading: Locator;
    readonly contactForm: Locator;
    readonly nameField: Locator;
    readonly emailField: Locator;
    readonly subjectField: Locator;
    readonly messageField: Locator;
    readonly submitButton: Locator;

    constructor(page: Page) {
        super(page);

        // Initialize Contact Form Elements
        this.contactFormHeading = page.getByRole('heading', { name: 'Contact Us' });
        this.contactForm = page.getByRole('form', { name: 'Contact form' });
        this.nameField = page.getByRole('textbox', { name: 'Your name' });
        this.emailField = page.getByRole('textbox', { name: 'Your email' });
        this.subjectField = page.getByRole('textbox', { name: 'Subject' });
        this.messageField = page.getByRole('textbox', { name: 'Your message (optional)' });
        this.submitButton = page.getByRole('button', { name: 'Submit' });
    }

    async scrollToContactForm() {
        await this.scrollToElement(this.contactFormHeading);
    }

    async fillName(name: string) {
        await this.nameField.fill(name);
    }

    async fillEmail(email: string) {
        await this.emailField.fill(email);
    }

    async fillSubject(subject: string) {
        await this.subjectField.fill(subject);
    }

    async fillMessage(message: string) {
        await this.messageField.fill(message);
    }

    async fillContactForm(name: string, email: string, subject: string, message: string = '') {
        await this.fillName(name);
        await this.fillEmail(email);
        await this.fillSubject(subject);
        if (message) {
            await this.fillMessage(message);
        }
    }

    async submitForm() {
        await this.submitButton.click();
        await this.waitForPageLoad();
    }

    async getNameValue(): Promise<string> {
        return await this.nameField.inputValue();
    }

    async getEmailValue(): Promise<string> {
        return await this.emailField.inputValue();
    }

    async getSubjectValue(): Promise<string> {
        return await this.subjectField.inputValue();
    }

    async getMessageValue(): Promise<string> {
        return await this.messageField.inputValue();
    }
}

