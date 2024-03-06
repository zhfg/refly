import { IENV, getEnv } from "./env"

const overrideLocalDev = true

export let PROD_DOMAIN = "https://refly.ai"
export let DEV_DOMAIN = "https://production-test.refly.ai"

export const getServerOrigin = () => {
  // return PROD_DOMAIN
  if (overrideLocalDev) {
    return "http://localhost:3000"
  }
  return getEnv() === IENV.DEVELOPMENT ? DEV_DOMAIN : PROD_DOMAIN
}

export const getClientOrigin = () => {
  if (overrideLocalDev) {
    return "http://localhost:5173/"
  }
  return getEnv() === IENV.DEVELOPMENT ? DEV_DOMAIN : PROD_DOMAIN
}

export function getExtensionUrl(url) {
  return chrome.runtime.getURL(url)
}
