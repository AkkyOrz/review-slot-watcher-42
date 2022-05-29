import puppeteer, { Page } from 'puppeteer';
// import { assert } from 'console';
import { createLogger, format, transports } from 'winston';
import dotenv from 'dotenv';
import clickButton from './button.js';
import { setCredentials, CredentialsTokyo42 } from './credentials.js';
// const { createLogger, format, transports } = require('winston');

const envPath = './.env';

dotenv.config({path: envPath})

const { combine, timestamp, label } = format;

type BrowserSettingType = {
  args?: Array<string>;
  executablePath?: string;
  userDataDir?: string;
  ignoreDefaultArgs?: Array<string>;
  headless?: boolean;
  slowMo?: number;
};

// const myFormat = printf(
//   ({ level, message, timestamp_ }: InfoType) =>
//     `${timestamp_} ${level}: ${message}`,
// );

const logger = createLogger({
  format: combine(label({ message: true }), timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'result.log' }),
  ],
});

const hasAlreadyLoggedIn42 = async (page: Page) => {
  await page.goto('https://discord.42tokyo.jp/');

  const loginMainDiv = await page.$('#user_login');

  return loginMainDiv === null;
};

const login42Tokyo = async (page: Page, cred42: CredentialsTokyo42) => {
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
    configs.executablePath = '/snap/bin/chromium';
    if (process.env.HOME) {
      configs.userDataDir = `${process.env.HOME}/snap/chromium/common/chromium/`;
    }
  } else if (process.env.ENVIRONMENT === 'browser') {
    configs.executablePath = '/snap/bin/chromium';
    if (process.env.HOME) {
      configs.userDataDir = `${process.env.HOME}/snap/chromium/common/chromium/`;
    }
  }

  return puppeteer.launch(configs);
};

const main = async () => {
  logger.info('start');

  const credentials = setCredentials(process.env);

  const browser = await launchBrowser();
  const page: Page = await browser.newPage();

  const hasLoggedIn42 = await hasAlreadyLoggedIn42(page);
  if (!hasLoggedIn42) {
    await login42Tokyo(page, credentials);
  } else {
    logger.info('already logged in 42');
  }
  await authorize42Tokyo(page);

  logger.info('finish');
  await browser.close();
};

main().catch(e => {logger.info(e)});
