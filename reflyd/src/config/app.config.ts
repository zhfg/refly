export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  vectorStore: {
    vectorDim: parseInt(process.env.REFLY_VEC_DIM, 10) || 1024,
  },
  serper: {
    apiKey: process.env.SERPER_API_KEY,
  },
  auth: {
    cookieTokenField: '_refly_ai_sid',
    cookieDomain: process.env.REFLY_COOKIE_DOMAIN || '.refly.ai',
    redirectUrl: process.env.LOGIN_REDIRECT_URL,
    jwt: {
      secret: process.env.JWT_SECRET || 'test',
      expiresIn: parseInt(process.env.JWT_EXPIRATION_TIME) || '14d',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || 'test',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'test',
      callbackUrl: process.env.GITHUB_CALLBACK_URL || 'test',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'test',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'test',
    },
  },
});
