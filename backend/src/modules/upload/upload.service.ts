import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private uploadDir: string;
  private publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.resolveActiveUploadDir();

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
   * Menemukan direktori upload yang valid dan dapat ditulis secara multi-tier.
   */
  private resolveActiveUploadDir(): string {
    const rawConfiguredPath =
      this.configService.get<string>('UPLOAD_STORAGE_PATH') ||
      path.join(process.cwd(), 'uploads');
    const cleanConfigured = rawConfiguredPath.replace(/^["']|["']$/g, '').trim();
    const configuredPath = path.isAbsolute(cleanConfigured)
      ? cleanConfigured
      : path.resolve(process.cwd(), cleanConfigured);

    const candidates = [
      configuredPath,
      path.resolve(process.cwd(), 'uploads'),
      path.resolve(__dirname, '../../../../uploads'),
      path.join(os.tmpdir(), 'taqtix-uploads'),
    ];

    for (const dir of candidates) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
        }
        fs.accessSync(dir, fs.constants.W_OK);
        return dir;
      } catch (err) {
        this.logger.warn(
          `Direktori upload ${dir} tidak dapat ditulis, mencoba kandidat berikutnya...`,
        );
      }
    }

    const fallbackPath = path.join(os.tmpdir(), 'taqtix-uploads');
    try {
      if (!fs.existsSync(fallbackPath)) {
        fs.mkdirSync(fallbackPath, { recursive: true, mode: 0o777 });
      }
    } catch {}
    return fallbackPath;
  }

  /**
   * Mengembalikan direktori aktif penyimpanan file lokal.
   */
  getUploadDir(): string {
    return this.uploadDir;
  }

  /**
   * Memproses file yang telah diunggah (mendukung memory buffer maupun disk file)
   * dan mengembalikan URL publik.
   */
  async processUploadedFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Tidak ada berkas file yang diunggah');
    }

    const targetDir = this.resolveActiveUploadDir();
    const ext =
      path.extname(file.originalname).toLowerCase() ||
      (file.mimetype === 'image/webp'
        ? '.webp'
        : file.mimetype === 'image/jpeg'
          ? '.jpg'
          : '.png');
    const cleanBase = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const uniqueSuffix =
      Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const filename = file.filename || `${cleanBase}-${uniqueSuffix}${ext}`;
    const destinationPath = path.join(targetDir, filename);

    // Tulis buffer ke disk jika file disimpan di memoryStorage
    if (file.buffer && file.buffer.length > 0) {
      try {
        await fs.promises.writeFile(destinationPath, file.buffer);
      } catch (writeErr) {
        this.logger.error(
          `Gagal menulis file ke ${destinationPath}:`,
          writeErr,
        );
        // Fallback darurat ke /tmp
        const emergencyDir = path.join(os.tmpdir(), 'taqtix-uploads');
        if (!fs.existsSync(emergencyDir)) {
          fs.mkdirSync(emergencyDir, { recursive: true, mode: 0o777 });
        }
        await fs.promises.writeFile(
          path.join(emergencyDir, filename),
          file.buffer,
        );
      }
    } else if (file.path && fs.existsSync(file.path)) {
      // Jika diskStorage Multer digunakan dan file berada di path lain
      if (path.resolve(file.path) !== path.resolve(destinationPath)) {
        try {
          await fs.promises.copyFile(file.path, destinationPath);
        } catch {
          // Tetap gunakan file.path yang ada jika copy gagal
        }
      }
    }

    // Bangun URL publik
    const cleanBaseUrl = this.publicBaseUrl.replace(/\/+$/, '');
    const fileUrl = `${cleanBaseUrl}/${filename}`;

    return {
      url: fileUrl,
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
