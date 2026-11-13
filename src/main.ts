import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalHttpExceptionFilter } from './utils/filters/http-exception.filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config: ConfigService = app.get(ConfigService);

  // Global Conventions
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // Swagger Documentation
  const conf = new DocumentBuilder()
    .setTitle('TMC Attendance & Access Control API')
    .setDescription(
      'REST API for TMC Attendance and Access Control System (Assignment M2)',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        description: 'Enter your JWT access token (e.g. Bearer <token>)',
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'Authorization',
    )
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, conf);
  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = config.get<number>('PORT', 3001);
  const baseUrl = config.get<string>('BASE_URL', 'http://localhost:');

  await app.listen(port, () => {
    console.log(`\x1b[36m[WEB]: ${baseUrl}${port}/api/v1\x1b[0m`);
    console.log(`\x1b[36m[SWAGGER]: ${baseUrl}${port}/swagger\x1b[0m`);
  });
}
bootstrap();
