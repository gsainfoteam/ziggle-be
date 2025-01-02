import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import expressBasicAuth from 'express-basic-auth';
import { json } from 'express';
import { CustomConfigService } from '@lib/custom-config';
import { ApiModule } from './api.module';

async function bootstrap() {
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
        in: 'header',
        bearerFormat: 'token',
        flows: {
          authorizationCode: {
            authorizationUrl: customConfigService.SWAGGER_AUTH_URL,
            tokenUrl: customConfigService.SWAGGER_TOKEN_URL,
            scopes: {
              openid: 'openid',
              email: 'email',
              profile: ' profile',
            },
          },
        },
      },
      'oauth2',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      oauth2RedirectUrl: `${customConfigService.API_URL}/api/oauth2-redirect.html`,
      displayRequestDuration: true,
    },
  });
  // start server
  await app.listen(3000);
}
bootstrap();
