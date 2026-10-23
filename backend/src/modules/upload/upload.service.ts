import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private uploadDir: string;
  private publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const rawConfiguredPath =
      this.configService.get<string>('UPLOAD_STORAGE_PATH') ||
      path.join(process.cwd(), 'uploads');
    const configuredPath = path.isAbsolute(rawConfiguredPath)
      ? rawConfiguredPath
      : path.resolve(process.cwd(), rawConfiguredPath);

    // Jika direktori sistem seperti /var/www tidak dapat ditulis (misal di local macOS/dev), fallback ke local uploads
    try {
      if (!fs.existsSync(configuredPath)) {
        fs.mkdirSync(configuredPath, { recursive: true, mode: 0o755 });
      }
      // Test write access
      fs.accessSync(configuredPath, fs.constants.W_OK);
      this.uploadDir = configuredPath;
    } catch {
      const fallbackPath = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(fallbackPath)) {
        fs.mkdirSync(fallbackPath, { recursive: true, mode: 0o755 });
      }
      this.uploadDir = fallbackPath;
      console.warn(
        `[UploadService] Storage path ${configuredPath} tidak dapat diakses. Menggunakan local directory: ${this.uploadDir}`,
      );
    }

    const configuredPublicUrl =
      this.configService.get<string>('UPLOAD_PUBLIC_BASE_URL');
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
      if (
        configuredPublicUrl &&
        !configuredPublicUrl.includes('localhost') &&
        !configuredPublicUrl.includes('127.0.0.1')
      ) {
        this.publicBaseUrl = configuredPublicUrl;
      } else {
        const taqtixBase =
          this.configService.get<string>('TAQTIX_BASE_URL') ||
          'https://api.taqtix.id';
        this.publicBaseUrl = `${taqtixBase.replace(/\/+$/, '')}/uploads`;
      }
    } else {
      this.publicBaseUrl =
        configuredPublicUrl ||
        `http://localhost:${this.configService.get<string>('PORT') || '3000'}/uploads`;
    }
  }

  /**
   * Mengembalikan direktori aktif penyimpanan file lokal.
   */
  getUploadDir(): string {
    return this.uploadDir;
  }

  /**
   * Memproses file yang telah diunggah oleh Multer dan mengembalikan URL publik.
   */
  processUploadedFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Tidak ada berkas file yang diunggah');
    }

    // Bangun URL publik
    const cleanBaseUrl = this.publicBaseUrl.replace(/\/+$/, '');
    const fileUrl = `${cleanBaseUrl}/${file.filename}`;

    return {
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
