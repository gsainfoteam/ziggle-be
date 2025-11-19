import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  IDP_URL: string;

  @IsString()
  @IsNotEmpty()
  IDP_BASE_URL: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  SWAGGER_USER: string;

  @IsString()
  @IsNotEmpty()
  SWAGGER_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  SWAGGER_AUTH_URL: string;

  @IsString()
  @IsNotEmpty()
  SWAGGER_TOKEN_URL: string;

  @IsString()
  @IsNotEmpty()
  FCM_PROJECT_ID: string;

  @IsString()
  @IsNotEmpty()
  FCM_CLIENT_EMAIL: string;

  @IsString()
  @IsNotEmpty()
  FCM_PRIVATE_KEY: string;

  @IsString()
  @IsNotEmpty()
  AWS_S3_BUCKET_NAME: string;

  @IsString()
  @IsNotEmpty()
  AWS_S3_REGION: string;

  @IsString()
  @IsNotEmpty()
  AWS_ACCESS_KEY_ID: string;

  @IsString()
  @IsNotEmpty()
  AWS_SECRET_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  CLIENT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @IsNumber()
  @IsNotEmpty()
  REDIS_PORT: number;

  @IsNumber()
  @IsNotEmpty()
  FCM_DELAY: number;

  @IsString()
  @IsNotEmpty()
  OPENAI_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  GROUPS_URL: string;

  @IsString()
  @IsNotEmpty()
  GROUPS_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  GROUPS_CLIENT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  API_URL: string;

  @IsString()
  @IsNotEmpty()
  CRAWL_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  FLUTTER_REDIRECT_URI: string;

  @IsString()
  @IsNotEmpty()
  LOCAL_REDIRECT_URI: string;

  @IsString()
  @IsNotEmpty()
  WEB_REDIRECT_URI: string;

  @IsString()
  @IsNotEmpty()
  DEEPL_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  CRAWLING_UPTIME_URI: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_ISSUER: string;

  @IsString()
  @IsNotEmpty()
  JWT_AUDIENCE: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRE: string;

  @IsString()
  @IsNotEmpty()
  REFRESH_TOKEN_EXPIRE: string;
}

export type EnvironmentVariableKeys = keyof EnvironmentVariables;

export function validate(config: Record<string, unknown>) {
  const validatedConfiguration = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfiguration, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfiguration;
}
