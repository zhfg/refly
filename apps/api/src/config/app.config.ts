export interface MinioConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export default () => ({
  port: parseInt(process.env.PORT) || 3000,
  wsPort: parseInt(process.env.WS_PORT) || 1234,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  staticEndpoint: process.env.STATIC_ENDPOINT || 'http://localhost:3000/v1/misc/',
  minio: {
    internal: {
      endPoint: process.env.MINIO_INTERNAL_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_INTERNAL_PORT) || 9000,
      useSSL: process.env.MINIO_INTERNAL_USE_SSL === 'true' || false,
      accessKey: process.env.MINIO_INTERNAL_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_INTERNAL_SECRET_KEY || 'minioadmin',
      bucket: process.env.MINIO_INTERNAL_BUCKET || 'refly-weblink',
    },
    external: {
      endPoint: process.env.MINIO_EXTERNAL_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_EXTERNAL_PORT) || 9000,
      useSSL: process.env.MINIO_EXTERNAL_USE_SSL === 'true' || false,
      accessKey: process.env.MINIO_EXTERNAL_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_EXTERNAL_SECRET_KEY || 'minioadmin',
      bucket: process.env.MINIO_EXTERNAL_BUCKET || 'refly-weblink',
    },
  },
  vectorStore: {
    host: process.env.QDRANT_HOST || 'localhost',
    port: parseInt(process.env.QDRANT_PORT) || 6333,
    apiKey: process.env.QDRANT_API_KEY,
    vectorDim: parseInt(process.env.REFLY_VEC_DIM) || 768,
  },
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
  },
  serper: {
    apiKey: process.env.SERPER_API_KEY,
  },
  fireworks: {
    apiKey: process.env.FIREWORKS_API_KEY,
  },
  auth: {
    cookieTokenField: '_refly_ai_sid',
    cookieDomain: process.env.REFLY_COOKIE_DOMAIN || '.refly.ai',
    redirectUrl: process.env.LOGIN_REDIRECT_URL,
    jwt: {
      secret: process.env.JWT_SECRET || 'test',
      expiresIn: process.env.JWT_EXPIRATION_TIME || '14d',
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
  rag: {
    jinaToken: process.env.JINA_TOKEN,
  },
  skill: {
    defaultModel: process.env.REFLY_DEFAULT_MODEL || 'openai/gpt-4o-mini',
  },
  stripe: {
    apiKey: process.env.STRIPE_API_KEY,
    webhookSecret: {
      account: process.env.STRIPE_ACCOUNT_WEBHOOK_SECRET,
      accountTest: process.env.STRIPE_ACCOUNT_TEST_WEBHOOK_SECRET,
    },
    sessionSuccessUrl: process.env.STRIPE_SESSION_SUCCESS_URL,
    sessionCancelUrl: process.env.STRIPE_SESSION_CANCEL_URL,
    portalReturnUrl: process.env.STRIPE_PORTAL_RETURN_URL,
  },
  quota: {
    token: {
      t1: parseInt(process.env.QUOTA_T1_TOKEN) || 0,
      t2: parseInt(process.env.QUOTA_T2_TOKEN) || 1000000,
    },
    storage: {
      object: parseInt(process.env.QUOTA_STORAGE_OBJECT) || 10 * 1024 * 1024 * 1024, // 10 GB
      vector: parseInt(process.env.QUOTA_STORAGE_VECTOR) || 1024 * 1024 * 1024, // 1 GB
    },
  },
});
