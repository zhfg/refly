import normalizeUrl from '@esm2cjs/normalize-url';

export const normalizeURL = (url: string) => {
  return normalizeUrl(url.trim(), {
    stripWWW: false,
    stripHash: true,
    removeTrailingSlash: true,
    removeSingleSlash: true,
    removeQueryParameters: ['ref', /^utm_\w+/i],
  });
};
