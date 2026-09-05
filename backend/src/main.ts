import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, HttpStatus } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Keamanan Jaringan: Trust proxy agar Throttler membaca IP asli via X-Forwarded-For
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // 2. Terapkan prefix routing global
  app.setGlobalPrefix('v1');

  // 3. Keamanan: Aktifkan Helmet & CORS
  app.use(helmet());
  app.enableCors({
    origin: true, // Menyesuaikan dengan kebutuhan origin di dev/production
    credentials: true,
  });

  // 4. Batasan Ukuran Payload (Proteksi Payload Bomb DDoS)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // 5. Validasi Global (class-validator & class-transformer)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. Global Exception Filter untuk standarisasi format response error
  app.useGlobalFilters(new HttpExceptionFilter());

  // 5. Global Response Interceptor untuk standarisasi format response sukses
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 6. Setup Swagger Auto-Documentation
  const config = new DocumentBuilder()
    .setTitle('TAQtix REST API')
    .setDescription('Dokumentasi API Core Engine Ticketing & Afiliasi TAQtix')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // 7. Jalankan server pada port terkonfigurasi
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`TAQtix Backend berjalan pada: http://localhost:${port}/v1`);
  console.log(
    `Dokumentasi API (Swagger) tersedia di: http://localhost:${port}/docs`,
  );
}
bootstrap();
