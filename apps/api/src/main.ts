import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // ─── Global Prefix ───────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Swagger / OpenAPI ───────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Data-Mesh API')
    .setDescription('Data-as-a-Service: EU Environmental Datasets')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ─── CORS ────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4200',
    credentials: true,
  });

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
