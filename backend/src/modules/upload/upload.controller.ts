import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import { UploadService } from './upload.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Uploads')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Public()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Upload file gambar banner / logo / lineup ke storage server lokal',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File berhasil diunggah ke storage lokal.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          let rawTargetDir =
            process.env.UPLOAD_STORAGE_PATH ||
            path.join(process.cwd(), 'uploads');
          if (rawTargetDir) {
            rawTargetDir = rawTargetDir.replace(/^["']|["']$/g, '').trim();
          }
          const targetDir = path.isAbsolute(rawTargetDir)
            ? rawTargetDir
            : path.resolve(process.cwd(), rawTargetDir);
          try {
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true, mode: 0o755 });
            }
            fs.accessSync(targetDir, fs.constants.W_OK);
            return cb(null, targetDir);
          } catch (err) {
            console.error(
              `[UploadController] Storage path ${targetDir} gagal/tidak dapat ditulis:`,
              err,
            );
            // Fallback 1: backend/uploads lokal
            try {
              const fallbackPath = path.resolve(process.cwd(), 'uploads');
              if (!fs.existsSync(fallbackPath)) {
                fs.mkdirSync(fallbackPath, { recursive: true, mode: 0o755 });
              }
              fs.accessSync(fallbackPath, fs.constants.W_OK);
              return cb(null, fallbackPath);
            } catch (fbErr) {
              // Fallback 2: /tmp/taqtix-uploads
              const tmpPath = path.join(os.tmpdir(), 'taqtix-uploads');
              try {
                if (!fs.existsSync(tmpPath)) {
                  fs.mkdirSync(tmpPath, { recursive: true, mode: 0o777 });
                }
                return cb(null, tmpPath);
              } catch (tmpErr) {
                return cb(tmpErr as Error, tmpPath);
              }
            }
          }
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + crypto.randomBytes(6).toString('hex');
          const ext = path.extname(file.originalname).toLowerCase();
          const cleanBase = path
            .basename(file.originalname, ext)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-');
          cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 25 * 1024 * 1024, // Maksimum 25MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',
          'image/svg+xml',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Format file tidak didukung. Harap unggah gambar (JPG, PNG, WebP, GIF, atau SVG).',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.processUploadedFile(file);
  }
}
