export enum IENV {
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
  const t = navigator.userAgent;
  const n = navigator.platform;
  const a = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K', 'macOS'];
  const i = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const s = ['iPhone', 'iPad', 'iPod'];
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
            : (() => {
                console.error('unable to detect os type, use Windows as default', n, t);
                return 'Windows';
              })();
};

export const isChrome = () => {
  const t = navigator.userAgent;
  const n = t.includes('Chrome') && t.includes('Safari');
  const a = t.includes('Edg');
  const i = t.includes('OPR');
  return n && !a && !i;
};
