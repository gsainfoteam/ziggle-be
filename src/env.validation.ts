import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  IDP_URL: string;

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
}

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
