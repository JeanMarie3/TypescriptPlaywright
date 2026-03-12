import { Page } from '@playwright/test';

/**
 * Extended Page type with custom methods for screenshot capture
 */
export interface ExtendedPage extends Page {
  waitForAllContent: () => Promise<void>;
  captureStep: (stepName: string) => Promise<void>;
}

