import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    // One JSON object per line in production, so pm2 / a log shipper can parse it.
    logger: new ConsoleLogger({ json: isProduction }),
  });
  app.use(helmet());

  if (isProduction && !process.env.CORS_ORIGIN) {
    throw new Error('CORS_ORIGIN must be set in production');
  }
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  // Interactive API docs at /docs, outside production only.
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Souvenirs API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, () =>
      SwaggerModule.createDocument(app, config),
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
