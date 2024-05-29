export const requestFilesNames = import.meta.glob("../requests/*.ts", {
  eager: true,
});
export type RequestFilename = keyof typeof requestFilesNames;
