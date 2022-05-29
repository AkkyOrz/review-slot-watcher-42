import { Page, ElementHandle } from 'puppeteer';
import assertIsDefined from './assertIsDefined.js';

type ClickButton = (
  page: Page,
  button: ElementHandle<Element> | null | undefined,
  selector?: string,
) => Promise<void>;

const clickButton: ClickButton = async (
  page: Page,
  button: ElementHandle<Element> | null | undefined,
  selector?: string,
) => {
  assertIsDefined(button);
  if (!selector) {
    await Promise.all([
      page.waitForNavigation({
        waitUntil: ['load', 'networkidle2'],
      }),
      button.click(),
    ]);
  } else {
    await Promise.all([
      page.waitForNavigation({
        waitUntil: ['load', 'networkidle2'],
      }),
      button.click(),
      page.waitForSelector(selector),
    ]);
  }
};

export default clickButton;
