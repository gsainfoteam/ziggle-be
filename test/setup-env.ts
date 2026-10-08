// CustomConfigModule validates env variables at import time,
// so unit tests need placeholder values that don't depend on a local .env file.
const testEnv: Record<string, string> = {
  IDP_URL: 'http://idp.test',
  IDP_BASE_URL: 'http://idp.test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  SWAGGER_USER: 'test',
  SWAGGER_PASSWORD: 'test',
  SWAGGER_AUTH_URL: 'http://idp.test/authorize',
  SWAGGER_TOKEN_URL: 'http://idp.test/token',
  FCM_PROJECT_ID: 'test',
  FCM_CLIENT_EMAIL: 'test@test.com',
  FCM_PRIVATE_KEY: 'test',
  AWS_S3_BUCKET_NAME: 'test',
  AWS_S3_REGION: 'ap-northeast-2',
  CLIENT_ID: 'test',
  CLIENT_SECRET: 'test',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  FCM_DELAY: '300000',
  GROUPS_URL: 'http://groups.test',
  API_URL: 'http://api.test',
  CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
  CRAWLING_UPTIME_URI: 'http://uptime.test',
  JWT_SECRET: 'test',
  JWT_ISSUER: 'test',
  JWT_AUDIENCE: 'test',
  JWT_EXPIRE: '1h',
  REFRESH_TOKEN_EXPIRE: '30d',
  LETSUR_GATEWAY_URL: 'http://llm.test',
  LETSUR_API_KEY: 'test',
  LLM_MODEL: 'test',
};

for (const [key, value] of Object.entries(testEnv)) {
  process.env[key] ??= value;
}
