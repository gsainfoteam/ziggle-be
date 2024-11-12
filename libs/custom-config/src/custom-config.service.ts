import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariableKeys } from '@lib/custom-config/env.validation';

@Injectable()
export class CustomConfigService {
  constructor(private configService: ConfigService) {}

  private getEnvVariable(key: EnvironmentVariableKeys) {
    return this.configService.getOrThrow(key);
  }

  get IDP_URL(): string {
    return this.getEnvVariable('IDP_URL');
  }

  get DATABASE_URL(): string {
    return this.getEnvVariable('DATABASE_URL');
  }

  get SWAGGER_USER(): string {
    return this.getEnvVariable('SWAGGER_USER');
  }

  get SWAGGER_PASSWORD(): string {
    return this.getEnvVariable('SWAGGER_PASSWORD');
  }

  get SWAGGER_AUTH_URL(): string {
    return this.getEnvVariable('SWAGGER_AUTH_URL');
  }

  get SWAGGER_TOKEN_URL(): string {
    return this.getEnvVariable('SWAGGER_TOKEN_URL');
  }

  get API_URL(): string {
    return this.getEnvVariable('API_URL');
  }

  get FCM_PROJECT_ID(): string {
    return this.getEnvVariable('FCM_PROJECT_ID');
  }

  get FCM_CLIENT_EMAIL(): string {
    return this.getEnvVariable('FCM_CLIENT_EMAIL');
  }

  get FCM_PRIVATE_KEY(): string {
    return this.getEnvVariable('FCM_PRIVATE_KEY');
  }

  get AWS_S3_BUCKET_NAME(): string {
    return this.getEnvVariable('AWS_S3_BUCKET_NAME');
  }

  get AWS_S3_REGION(): string {
    return this.getEnvVariable('AWS_S3_REGION');
  }

  get AWS_ACCESS_KEY_ID(): string {
    return this.getEnvVariable('AWS_ACCESS_KEY_ID');
  }

  get AWS_SECRET_ACCESS_KEY(): string {
    return this.getEnvVariable('AWS_SECRET_ACCESS_KEY');
  }

  get CLIENT_ID(): string {
    return this.getEnvVariable('CLIENT_ID');
  }

  get CLIENT_SECRET(): string {
    return this.getEnvVariable('CLIENT_SECRET');
  }

  get REDIS_HOST(): string {
    return this.getEnvVariable('REDIS_HOST');
  }

  get REDIS_PORT(): number {
    return this.getEnvVariable('REDIS_PORT');
  }

  get FCM_DELAY(): number {
    return this.getEnvVariable('FCM_DELAY');
  }

  get OPENAI_API_KEY(): string {
    return this.getEnvVariable('OPENAI_API_KEY');
  }

  get GROUPS_URL(): string {
    return this.getEnvVariable('GROUPS_URL');
  }

  get GROUPS_CLIENT_ID(): string {
    return this.getEnvVariable('GROUPS_CLIENT_ID');
  }

  get GROUPS_CLIENT_SECRET(): string {
    return this.getEnvVariable('GROUPS_CLIENT_SECRET');
  }

  get CRAWL_PASSWORD(): string {
    return this.getEnvVariable('CRAWL_PASSWORD');
  }

  get FLUTTER_REDIRECT_URI(): string {
    return this.getEnvVariable('FLUTTER_REDIRECT_URI');
  }

  get LOCAL_REDIRECT_URI(): string {
    return this.getEnvVariable('LOCAL_REDIRECT_URI');
  }

  get WEB_REDIRECT_URI(): string {
    return this.getEnvVariable('WEB_REDIRECT_URI');
  }

  get DEEPL_API_KEY(): string {
    return this.getEnvVariable('DEEPL_API_KEY');
  }
}
