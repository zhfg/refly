export const enum IENV {
  PRODUCTION = 'production',
  STAGING = 'staging',
  TEST = 'test',
  DEVELOPMENT = 'development',
}

export const getEnv = (): IENV => {
  const env = process.env.NODE_ENV;

  return env as IENV;
};

export const getOsType = () => {
  let t = navigator.userAgent,
    n = navigator.platform,
    a = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K', 'macOS'],
    i = ['Win32', 'Win64', 'Windows', 'WinCE'],
    s = ['iPhone', 'iPad', 'iPod'];
  return a.indexOf(n) !== -1
    ? 'OSX'
    : s.indexOf(n) !== -1
    ? 'IOS'
    : i.indexOf(n) !== -1
    ? 'Windows'
    : /Android/.test(t)
    ? 'Android'
    : /Linux/.test(n)
    ? 'Linux'
    : (console.error('unable to detect os type, use Windows as default', n, t), 'Windows');
};

export const isChrome = () => {
  let t = navigator.userAgent,
    n = t.includes('Chrome') && t.includes('Safari'),
    a = t.includes('Edg'),
    i = t.includes('OPR');
  return n && !a && !i;
};
