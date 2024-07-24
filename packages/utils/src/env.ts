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
