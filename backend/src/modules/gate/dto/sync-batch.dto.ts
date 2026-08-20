import {
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ScanLogItemDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Payload signed QR token',
  })
  @IsString()
  @IsNotEmpty({ message: 'QR payload tidak boleh kosong' })
  qrPayload!: string;

  @ApiProperty({
    example: '2026-08-20T03:10:00Z',
    description: 'Waktu pemindaian offline',
  })
  @IsDateString({}, { message: 'Format tanggal pemindaian tidak valid' })
  scannedAt!: string;
}

export class SyncBatchDto {
  @ApiProperty({
    type: [ScanLogItemDto],
    description: 'Daftar logs scan offline yang akan disinkronkan',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScanLogItemDto)
  logs!: ScanLogItemDto[];
}
