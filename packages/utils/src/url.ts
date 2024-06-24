import { IENV, getEnv } from './env';

const overrideLocalDev = false;

export let SENTRY_DSN =
  'https://3a105c6104e4c4de3ead00dc11f16623@o4507205453414400.ingest.us.sentry.io/4507209639133184';

export const PROD_DOMAIN = 'https://www.refly.ai';
export const DEV_DOMAIN = 'https://production-test.refly.ai';

export const SERVER_PROD_DOMAIN = 'https://api.refly.ai';
export const SERVER_DEV_DOMAIN = 'http://localhost:3000';

export const CLIENT_PROD_DOMAIN = 'https://www.refly.ai';
export const CLIENT_DEV_DOMAIN = 'http://localhost:5173';

export const CLIENT_DEV_COOKIE_DOMAIN = 'http://localhost:3000';
export const CLIENT_PROD_COOKIE_DOMAIN = '.refly.ai';

export let SERVERLESS_WORKER_DEV_DOMAIN = 'http://localhost:8787';
export let SERVERLESS_WORKER_PROD_DOMAIN = 'https://worker.refly.ai'; // TODO：这里需要更换成实际的 worker 地址

export const getCookieOrigin = () => {
  if (overrideLocalDev) {
    return 'http://localhost:5173/';
  }
  return getEnv() === IENV.DEVELOPMENT ? CLIENT_DEV_COOKIE_DOMAIN : CLIENT_PROD_COOKIE_DOMAIN;
};

export const getExtensionId = () => {
  if (overrideLocalDev) {
    return 'lecbjbapfkinmikhadakbclblnemmjpd';
  }

  return getEnv() === IENV.DEVELOPMENT ? 'lecbjbapfkinmikhadakbclblnemmjpd' : 'lecbjbapfkinmikhadakbclblnemmjpd';
};

export const getServerOrigin = () => {
  // return PROD_DOMAIN
  if (overrideLocalDev) {
    return 'http://localhost:3000';
  }
  return getEnv() === IENV.DEVELOPMENT ? SERVER_DEV_DOMAIN : SERVER_PROD_DOMAIN;
};

export const getClientOrigin = () => {
  if (overrideLocalDev) {
    return 'http://localhost:5173/';
  }
  return getEnv() === IENV.DEVELOPMENT ? CLIENT_DEV_DOMAIN : CLIENT_PROD_DOMAIN;
};

export function getExtensionUrl(url: any) {
  return chrome?.runtime.getURL(url);
}

export function safeParseURL(url: string) {
  try {
    const urlObj = new URL(url);

    return urlObj?.origin;
  } catch (err) {
    return url || '';
  }
}

export const getServerlessWorkOrigin = () => {
  if (overrideLocalDev) {
    return 'http://localhost:8787';
  }

  return getEnv() === IENV.DEVELOPMENT ? SERVERLESS_WORKER_DEV_DOMAIN : SERVERLESS_WORKER_PROD_DOMAIN;
};
