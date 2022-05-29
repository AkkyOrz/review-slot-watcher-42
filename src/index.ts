import puppeteer, { Page } from 'puppeteer';
import { createLogger, format, transports } from 'winston';
import dotenv from 'dotenv';
import clickButton from './button.js';
import { setCredentials, CredentialsTokyo42 } from './credentials.js';

const envPath = './.env';

dotenv.config({ path: envPath });

const { combine, timestamp, label } = format;

type BrowserSettingType = {
  args?: Array<string>;
  executablePath?: string;
  userDataDir?: string;
  ignoreDefaultArgs?: Array<string>;
  headless?: boolean;
  slowMo?: number;
};

const logger = createLogger({
  format: combine(label({ message: true }), timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'result.log' }),
  ],
});

const login42Tokyo = async (page: Page, cred42: CredentialsTokyo42) => {
  logger.info('-----------42tokyo login------------');
  await page.goto('https://signin.intra.42.fr/users/sign_in');
  await page.type('#user_login', cred42.name);
  await page.type('#user_password', cred42.password);

  const submitButtonDiv = await page.$('.form-actions');
  const submitButton = await submitButtonDiv?.$('.btn');
  await clickButton(page, submitButton);
  logger.info('-----------42tokyo login success------------');
};

const authorize42Tokyo = async (page: Page) => {
  const authorizeButtonDiv = await page.$('.actions');
  const authorizeButton = await authorizeButtonDiv?.$('.btn-success');
  await clickButton(page, authorizeButton);
  logger.info('-----------42tokyo OAuth success------------');
};

const launchBrowser = async () => {
  const configs: BrowserSettingType = {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    ignoreDefaultArgs: ['--disable-extensions'],
  };
  if (process.env.ENVIRONMENT === 'local') {
    configs.headless = false;
    configs.slowMo = 10;
  }
  return puppeteer.launch(configs);
};

const convertTo24Hour = (at_time: string) => {
  const [time, ap] = at_time.split(' ');
  const [hr, min] = time.split(':');
  if (ap === 'PM') {
    return `${parseInt(hr) + 12}:${min}`;
  }
  return `${hr}:${min}`;
}

const getSchedules = async (page: Page, url: string) => {
  logger.info('-----------get schedules------------');

  await Promise.all([
    page.goto(url),
    page.waitForSelector('div[class=fc-view-container]'),
  ]);

  await page.waitForTimeout(1000);
  const slotDivs = await page.$$('a.fc-time-grid-event');
  const slotPeriods = await Promise.all(slotDivs.map(async (slotDiv) => {
    const children = await slotDiv.$('div.fc-content > div.fc-time');
    if (children) {
       const period = await page.evaluate(span => span.getAttribute('data-full'), children);
      return period.split('-').map((p: string) => p.trim());
    }
  }));

  logger.info(slotPeriods);
  return slotPeriods;
};

const main = async () => {
  logger.info('start');

  const credentials = setCredentials(process.env);

  const browser = await launchBrowser();
  const page: Page = await browser.newPage();

  await login42Tokyo(page, credentials);

  const schedules = await getSchedules(page, credentials.url);
  const schedules24 = schedules.map(([start, end]) => {
    return [start, end].map(convertTo24Hour);
  });
  console.log(schedules24);
  // await page.waitForTimeout(1000000);

  logger.info('finish');
  await browser.close();
};

main().catch((e) => {
  logger.info(e);
});
