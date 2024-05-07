import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import expressBasicAuth from 'express-basic-auth';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // swagger auth config
  const configService = app.get(ConfigService);
  app.use(
    ['/api'],
    expressBasicAuth({
      challenge: true,
      users: {
        [configService.getOrThrow<string>('SWAGGER_USER')]:
          configService.getOrThrow<string>('SWAGGER_PASSWORD'),
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
    .setDescription('Ziggle API')
    .setVersion('1.0')
    .addTag('Ziggle')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  // start server
  await app.listen(3000);
}
bootstrap();
