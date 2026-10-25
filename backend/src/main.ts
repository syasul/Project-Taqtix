import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, HttpStatus } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // 1. Keamanan Jaringan: Trust proxy agar Throttler membaca IP asli via X-Forwarded-For
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // 1.1 Sajikan file statis upload untuk akses lokal server
  const rawUploadPath =
    process.env.UPLOAD_STORAGE_PATH || path.join(process.cwd(), 'uploads');
  const cleanUploadPath = rawUploadPath.replace(/^["']|["']$/g, '').trim();
  const uploadPath = path.isAbsolute(cleanUploadPath)
    ? cleanUploadPath
    : path.resolve(process.cwd(), cleanUploadPath);

  try {
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
    }
    const staticOptions = {
      setHeaders: (res: any) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', '*');
      },
    };
    app.use('/uploads', express.static(uploadPath, staticOptions));
    app.use('/v1/uploads', express.static(uploadPath, staticOptions));

    // Fallback lokal jika direktori berbeda
    const localUploads = path.resolve(process.cwd(), 'uploads');
    if (localUploads !== uploadPath) {
      if (!fs.existsSync(localUploads)) {
        fs.mkdirSync(localUploads, { recursive: true, mode: 0o755 });
      }
      app.use('/uploads', express.static(localUploads, staticOptions));
      app.use('/v1/uploads', express.static(localUploads, staticOptions));
    }

    const tmpUploads = path.join(os.tmpdir(), 'taqtix-uploads');
    if (!fs.existsSync(tmpUploads)) {
      try {
        fs.mkdirSync(tmpUploads, { recursive: true, mode: 0o777 });
      } catch {}
    }
    app.use('/uploads', express.static(tmpUploads, staticOptions));
    app.use('/v1/uploads', express.static(tmpUploads, staticOptions));
  } catch (err) {
    console.warn('[Main] Gagal menginisialisasi static upload handler:', err);
  }

  // 2. Terapkan prefix routing global (kecualikan webhook payments agar dapat diakses langsung)
  app.setGlobalPrefix('v1', {
    exclude: ['payments/webhook/(.*)', 'payments/webhook'],
  });

  // 3. Keamanan: Aktifkan Helmet & CORS (izinkan cross-origin untuk aset gambar static)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors({
    origin: true, // Menyesuaikan dengan kebutuhan origin di dev/production
    credentials: true,
  });

  // 4. Batasan Ukuran Payload & capture raw body buffer untuk verifikasi HMAC signature payment gateway (DOKU)
  app.use(
    express.json({
      limit: '25mb',
      verify: (req: any, _res: any, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

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
