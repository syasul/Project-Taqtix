import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

export class CreateRundownDto {
  @ApiProperty({
    description: 'Waktu atau rentang jam sesi (misal: 08:00 - 09:00 atau 09:30 WIB)',
    example: '08:00 - 09:00',
  })
  @IsString()
  @IsNotEmpty({ message: 'Waktu sesi wajib diisi' })
  timeRange!: string;

  @ApiProperty({
    description: 'Judul atau nama sesi acara',
    example: 'Open Gate & Registrasi Kehadiran',
  })
  @IsString()
  @IsNotEmpty({ message: 'Judul agenda wajib diisi' })
  title!: string;

  @ApiPropertyOptional({
    description: 'Deskripsi lengkap atau poin agenda kegiatan',
    example: 'Pemeriksaan barang bawaan dan pemindaian barcode e-ticket di pintu masuk venue oleh panitia.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Tandai sebagai sesi utama / highlight dengan aksen visual khusus',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isHighlight?: boolean;

  @ApiPropertyOptional({
    description: 'Urutan tampilan agenda',
    example: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

