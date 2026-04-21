import { initializeOpenTelemetry, shutdownOpenTelemetry } from './otel';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import expressBasicAuth from 'express-basic-auth';
import { json } from 'express';
import { CustomConfigService } from '@lib/custom-config';
import { initializeMetrics } from '@lib/metrics';
import { ApiModule } from './api.module';
import { MetricsInterceptor } from './metrics/metrics.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(ApiModule);
  const customConfigService = app.get(CustomConfigService);
  // swagger auth config
  app.use(
    ['/api'],
    expressBasicAuth({
      challenge: true,
      users: {
        [customConfigService.SWAGGER_USER]:
          customConfigService.SWAGGER_PASSWORD,
      },
    }),
  );
  // set CORS config
  const allowedOriginSet = new Set(
    customConfigService.CORS_ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
      .map((origin) => {
        try {
          const parsedOrigin = new URL(origin);
          if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
            throw new Error('Invalid protocol');
          }
          return parsedOrigin.origin;
        } catch {
          throw new Error(`Invalid CORS_ALLOWED_ORIGINS value: ${origin}`);
        }
      }),
  );

  app.enableCors({
    origin: function (
      origin: string | undefined,
      callback: (
        err: Error | null,
        allow?: boolean | string | RegExp | (string | RegExp)[],
      ) => void,
    ) {
      if (!origin) {
        callback(null, true);
        return;
      }

      let normalizedOrigin: string;
      try {
        const parsedOrigin = new URL(origin);
        if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
          callback(new Error('Not allowed by CORS'));
          return;
        }
        normalizedOrigin = parsedOrigin.origin;
      } catch {
        callback(new Error('Not allowed by CORS'));
        return;
      }

      if (allowedOriginSet.has(normalizedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });

  // set json limit
  app.use(json({ limit: '5mb' }));
  // set cookie config
  app.use(cookieParser());
  // set swagger config
  const config = new DocumentBuilder()
    .setTitle('Ziggle API')
    .setDescription(
      'Backend API for Ziggle\n[GitHub](https://github.com/gsainfoteam/ziggle-be)',
    )
    .setVersion('1.0')
    .addTag('Ziggle')
    .addOAuth2(
      {
        type: 'oauth2',
        scheme: 'bearer',
        name: 'idp-token',
        in: 'header',
        bearerFormat: 'token',
        flows: {
          authorizationCode: {
            authorizationUrl: customConfigService.SWAGGER_AUTH_URL,
            tokenUrl: customConfigService.SWAGGER_TOKEN_URL,
            scopes: {
              openid: 'openid',
              email: 'email',
              name: ' name',
              picture: 'picture',
            },
          },
        },
      },
      'oauth2',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'JWT',
        in: 'header',
      },
      'jwt',
    )
    .addSecurity('groups-auth', {
      type: 'apiKey',
      bearerFormat: 'token',
      name: 'groups-token',
      description: 'Enter groups token',
      in: 'header',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      oauth2RedirectUrl: `${customConfigService.API_URL}/api/oauth2-redirect.html`,
      displayRequestDuration: true,
      initOAuth: {
        usePkceWithAuthorizationCodeGrant: true,
        additionalQueryStringParams: { nonce: 'help' },
        clientId: customConfigService.CLIENT_ID,
      },
    },
  });

  app.useGlobalInterceptors(new MetricsInterceptor());

  let isShuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    let exitCode = 0;
    logger.log(`Received ${signal}. Starting graceful shutdown.`);

    try {
      await app.close();
    } catch (error) {
      exitCode = 1;
      logger.error('Failed to close Nest application', error);
    } finally {
      try {
        await shutdownOpenTelemetry();
      } catch (error) {
        exitCode = 1;
        logger.error('Failed to shutdown OpenTelemetry SDK', error);
      }
      process.exit(exitCode);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // start server
  await app.listen(3000);
}

void initializeOpenTelemetry()
  .then(() => {
    initializeMetrics();
    return bootstrap();
  })
  .catch((error: unknown) => {
    const logger = new Logger('Bootstrap');
    logger.error('Failed to initialize OpenTelemetry', error);
    process.exit(1);
  });
