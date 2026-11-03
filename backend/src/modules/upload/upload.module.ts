import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadsServeController } from './uploads-serve.controller';
import { UploadService } from './upload.service';

@Module({
  controllers: [UploadController, UploadsServeController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
