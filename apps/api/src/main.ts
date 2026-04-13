import { initializeOpenTelemetry, shutdownOpenTelemetry } from './otel';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import expressBasicAuth from 'express-basic-auth';
import { json } from 'express';
import { CustomConfigService } from '@lib/custom-config';
import { metricsRegistry } from '@lib/metrics';
import { ApiModule } from './api.module';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import * as http from 'http';

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
  const whitelist = [
    /https:\/\/.*gistory.me/,
    /https:\/\/.*ziggle.gistory.me/,
    /https:\/\/.*ziggle-fe.pages.dev/,
    /http:\/\/localhost:3000/,
  ];
  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || whitelist.some((regex) => regex.test(origin))) {
        callback(null, origin);
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

  const metricsServer = http.createServer(async (req, res) => {
    try {
      if (req.url === '/metrics' && req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', metricsRegistry.contentType);
        res.end(await metricsRegistry.metrics());
        return;
      }

      if (req.url === '/metrics') {
        res.statusCode = 405;
        res.setHeader('Allow', 'GET');
        res.end('Method Not Allowed');
        return;
      }

      res.statusCode = 404;
      res.end('Not Found');
    } catch (error) {
      logger.error('Metrics error', error);
      res.statusCode = 500;
      res.end('Metrics error');
    }
  });

  metricsServer.listen(customConfigService.METRICS_PORT);

  let isShuttingDown = false;

  const closeMetricsServer = () =>
    new Promise<void>((resolve, reject) => {
      metricsServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

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
        await closeMetricsServer();
      } catch (error) {
        exitCode = 1;
        logger.error('Failed to close metrics server', error);
      }
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
  .then(bootstrap)
  .catch((error: unknown) => {
    const logger = new Logger('Bootstrap');
    logger.error('Failed to initialize OpenTelemetry', error);
    process.exit(1);
  });
