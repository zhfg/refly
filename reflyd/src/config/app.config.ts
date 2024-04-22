export default () => ({
  port: parseInt(process.env.PORT) || 3000,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL || 'false',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    weblinkBucket: process.env.MINIO_WEBLINK_BUCKET || 'refly-weblink',
  },
  vectorStore: {
    host: process.env.WEAVIATE_INSTANCE_URL,
    apiKey: process.env.WEAVIATE_API_KEY,
    vectorDim: parseInt(process.env.REFLY_VEC_DIM) || 256,
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
