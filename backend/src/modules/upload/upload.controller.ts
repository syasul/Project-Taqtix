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
import { UploadService } from './upload.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Uploads')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Roles('organizer', 'admin', 'buyer')
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
          // Akses upload directory yang telah diverifikasi
          const uploadService: UploadService = (req as any).uploadServiceRef;
          const targetDir = uploadService
            ? uploadService.getUploadDir()
            : path.join(process.cwd(), 'uploads');
          cb(null, targetDir);
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
        fileSize: 5 * 1024 * 1024, // Maksimum 5MB
      },
      fileFilter: (req, file, cb) => {
        // Simpan referensi service untuk diakses di diskStorage destination
        (req as any).uploadServiceRef = (req as any).res?.req?.app?.get
          ? (req as any).res.req.app.get(UploadService)
          : null;

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
