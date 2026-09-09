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
    const configuredPath =
      this.configService.get<string>('UPLOAD_STORAGE_PATH') ||
      path.join(process.cwd(), 'uploads');

    // Jika direktori sistem seperti /var/www tidak dapat ditulis (misal di local macOS/dev), fallback ke local uploads
    try {
      if (!fs.existsSync(configuredPath)) {
        fs.mkdirSync(configuredPath, { recursive: true });
      }
      // Test write access
      fs.accessSync(configuredPath, fs.constants.W_OK);
      this.uploadDir = configuredPath;
    } catch {
      const fallbackPath = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(fallbackPath)) {
        fs.mkdirSync(fallbackPath, { recursive: true });
      }
      this.uploadDir = fallbackPath;
      console.warn(
        `[UploadService] Storage path ${configuredPath} tidak dapat diakses. Menggunakan local directory: ${this.uploadDir}`,
      );
    }

    this.publicBaseUrl =
      this.configService.get<string>('UPLOAD_PUBLIC_BASE_URL') ||
      'http://localhost:3000/uploads';
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
