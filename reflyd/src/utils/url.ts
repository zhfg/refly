import normalizeUrl from '@esm2cjs/normalize-url';

export const normalizeURL = (url: string) => {
  return normalizeUrl(url.trim(), {
    stripWWW: false,
    stripHash: true,
    removeQueryParameters: ['ref', /^utm_\w+/i],
  });
};

export const hasUrlRedirected = (origin: string, current: string) => {
  if (!origin || !current) {
    return false;
  }
  const normalize = (url: string) =>
    normalizeUrl(url.trim(), {
      stripHash: true,
      removeQueryParameters: true,
    });
  return normalize(origin) !== normalize(current);
};
