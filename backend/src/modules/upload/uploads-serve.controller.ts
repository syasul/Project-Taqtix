import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Controller khusus untuk menyajikan file upload (banner, logo, lineup) secara publik.
 * Mendukung akses langsung via /uploads/:filename maupun /v1/uploads/:filename.
 * Memeriksa seluruh kandidat lokasi penyimpanan (root uploads, backend/uploads, /tmp/taqtix-uploads).
 */
@Controller(['uploads', 'v1/uploads'])
export class UploadsServeController {
  private readonly logger = new Logger(UploadsServeController.name);

  @Get(':filename')
  @Public()
  serveFile(
    @Param('filename') filename: string,
    @Res() res: express.Response,
  ) {
    if (!filename) {
      throw new NotFoundException('Nama berkas tidak valid');
    }

    // Sanitasi filename untuk mencegah Directory Traversal attack
    const safeFilename = path.basename(filename);

    const candidates = [
      path.resolve(process.cwd(), 'uploads', safeFilename),
      path.resolve(process.cwd(), '../uploads', safeFilename),
      path.resolve(process.cwd(), 'backend/uploads', safeFilename),
      path.resolve(__dirname, '../../../../uploads', safeFilename),
      path.resolve(__dirname, '../../../../../uploads', safeFilename),
      path.join(os.tmpdir(), 'taqtix-uploads', safeFilename),
      `/root/Project-Taqtix/backend/uploads/${safeFilename}`,
      `/root/Project-Taqtix/uploads/${safeFilename}`,
      `/var/www/taqtix/backend/uploads/${safeFilename}`,
      `/var/www/taqtix/uploads/${safeFilename}`,
    ];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.sendFile(filePath);
      }
    }

    this.logger.warn(
      `[UploadsServeController] Berkas "${safeFilename}" tidak ditemukan di kandidat path: ${candidates.slice(0, 4).join(', ')}`,
    );

    throw new NotFoundException(
      `Berkas "${safeFilename}" tidak ditemukan di server`,
    );
  }
}
