import { IENV, getEnv } from "./env"

const overrideLocalDev = false

export const PROD_DOMAIN = "https://www.refly.ai"
export const DEV_DOMAIN = "https://production-test.refly.ai"

export const SERVER_PROD_DOMAIN = "https://api.refly.ai"
export const SERVER_DEV_DOMAIN = "http://localhost:3000"

export const CLIENT_PROD_DOMAIN = "https://www.refly.ai"
export const CLIENT_DEV_DOMAIN = "http://localhost:5173"

export const CLIENT_DEV_COOKIE_DOMAIN = "http://localhost:3000"
export const CLIENT_PROD_COOKIE_DOMAIN = ".refly.ai"

export const getCookieOrigin = () => {
  if (overrideLocalDev) {
    return "http://localhost:5173/"
  }
  return getEnv() === IENV.DEVELOPMENT
    ? CLIENT_DEV_COOKIE_DOMAIN
    : CLIENT_PROD_COOKIE_DOMAIN
}

export const getExtensionId = () => {
  if (overrideLocalDev) {
    return "fcncfleeddfdpbigljgiejfdkmpkldpe"
  }

  return getEnv() === IENV.DEVELOPMENT
    ? "fcncfleeddfdpbigljgiejfdkmpkldpe"
    : "lecbjbapfkinmikhadakbclblnemmjpd"
}

export const getServerOrigin = () => {
  // return PROD_DOMAIN
  if (overrideLocalDev) {
    return "http://localhost:3000"
  }
  return getEnv() === IENV.DEVELOPMENT ? SERVER_DEV_DOMAIN : SERVER_PROD_DOMAIN
}

export const getClientOrigin = () => {
  if (overrideLocalDev) {
    return "http://localhost:5173/"
  }
  return getEnv() === IENV.DEVELOPMENT ? CLIENT_DEV_DOMAIN : CLIENT_PROD_DOMAIN
}

export function getExtensionUrl(url: any) {
  return chrome.runtime.getURL(url)
}
