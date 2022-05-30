import puppeteer, { Page } from 'puppeteer';
import { createLogger, format, transports } from 'winston';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import clickButton from './button.js';
import { setCredentials, CredentialsTokyo42 } from './credentials.js';
import assertIsDefined from './assertIsDefined.js';
import { assert } from 'console';

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

type Period = {
  start: string;
  end: string;
}

const convertTo24Hour = (at_time: string) => {
  const [time, ap] = at_time.split(' ');
  const [hr, min] = time.split(':');
  if (ap === 'PM' && hr !== '12') {
    return `${parseInt(hr) + 12}:${min}`;
  }
  return `${hr}:${min}`;
}

// const getSchedulesFromSlot = async (page: Page) => {
const getSchedulesFromSlot = async (page: Page, elem: puppeteer.ElementHandle<Element>) => {
  const sletElms = await elem.$$('a.fc-time-grid-event');
  const slotPeriods = await Promise.all(sletElms.map(async (slot) => {
    const children = await (await slot.$('div.fc-content'))?.$('div.fc-time');
    if (children) {
      const period = await page.evaluate(el => el.getAttribute('data-full'), children);
      if (period) {
        return await period.split('-').map((p: string) => p.trim());
      }
    }
  }));

  return slotPeriods.filter((item): item is NonNullable<typeof item> => item != null);
}

const getSchedules = async (page: Page, url: string) => {
  logger.info('-----------get schedules------------');

  await Promise.all([
    page.goto(url),
    page.waitForSelector('div[class=fc-view-container]'),
  ]);

  await page.waitForTimeout(1000);

  const weekHeader = await page.$$('div.fc-row.fc-widget-header > table > thead > tr > th.fc-day-header');
  const weekDays: Array<string> = await Promise.all(
    weekHeader
      .map(async (header) => {
        const res = await (await header.getProperty('textContent')).jsonValue();
        return res as string;
      }
    )
  );
  const topLevelTables = (await page.$$('div[class=fc-content-skeleton] > table > tbody > tr > td')).slice(1);
  const slotPeriodsPerDay = await Promise.all(topLevelTables.map(async (table) => {
    return await getSchedulesFromSlot(page, table);
  }));

  const leftButton = await page.$('button.fc-next-button');
  assertIsDefined(leftButton);
  await leftButton.click();
  await page.waitForTimeout(1000);

  return {weekDays, slotPeriodsPerDay};
};

const postWebhook = async (span: Array<Array<Period>>, weekDays: Array<string>, url: string) => {
  const body = {
    username: 'スロットbot',
    embeds: [
      {
        color: 0x36a64f,
        title: 'スロット',
        fields: span.map((periods, index) => {
          const slots = periods.map((period) => {
            return `${period.start} - ${period.end}`;
          });
          if (slots.length !== 0) {
            return {
              name: `${weekDays[index]}`,
              value: slots.join('\n'),
            };
          }
        }).filter((item): item is NonNullable<typeof item> => item != null),
      },
    ],
  };
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
  const response = await fetch(url, options).then(response => response.text())
  .catch(e => logger.error(e));
  logger.info(response);
}

const main = async () => {
  logger.info('start');

  const credentials = setCredentials(process.env);

  const browser = await launchBrowser();
  const page: Page = await browser.newPage();

  await login42Tokyo(page, credentials);

  const scheduleObj = await getSchedules(page, credentials.url);
  const schedules24: Array<Array<Period>> = scheduleObj['slotPeriodsPerDay'].map((schedule) => {
    return schedule.map(([start, end]) => {
      const [first, second] = [start, end].map(convertTo24Hour);
      return { start: first, end: second };
    });
  });
  logger.info('crolling finished');
  await browser.close();

  if (schedules24.length > 0) {
   logger.info('post webhook');
   await postWebhook(schedules24, scheduleObj['weekDays'], credentials.webhook);
  }
  logger.info('finish');
};

main();
