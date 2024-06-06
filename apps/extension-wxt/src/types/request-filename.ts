export const requestFileNameModuleMap = import.meta.glob('../requests/*.ts', {
  eager: true,
});
export const requestFileNames = Object.keys(appConfig.url);
export type RequestFilename = keyof typeof requestFileNames;
