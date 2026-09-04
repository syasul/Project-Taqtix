import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({
    example: 'Taqwa Movement Concert 2026',
    description: 'Judul/Nama acara',
  })
  @IsString()
  @IsNotEmpty({ message: 'Judul event tidak boleh kosong' })
  title!: string;

  @ApiProperty({
    example: 'Stress test pertama untuk ticketing.',
    required: false,
    description: 'Deskripsi lengkap acara',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'Jakarta Convention Center, Senayan',
    description: 'Lokasi acara',
  })
  @IsString()
  @IsNotEmpty({ message: 'Lokasi tidak boleh kosong' })
  location!: string;

  @ApiProperty({
    example: '2026-09-12T13:00:00Z',
    description: 'Waktu mulai acara',
  })
  @IsDateString({}, { message: 'Tanggal mulai tidak valid' })
  startDate!: string;

  @ApiProperty({
    example: '2026-09-12T22:00:00Z',
    description: 'Waktu selesai acara',
  })
  @IsDateString({}, { message: 'Tanggal selesai tidak valid' })
  endDate!: string;

  @ApiProperty({
    example: 'https://images.taqtix.id/banners/event1.jpg',
    required: false,
    description: 'URL banner event',
  })
  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Apakah pengunjung harus login sebelum membeli tiket',
  })
  @IsBoolean()
  @IsOptional()
  requireLogin?: boolean;

  @ApiProperty({
    example: 'Konser Akbar Taqwa Movement 2026 - Tiket Resmi',
    required: false,
    description: 'Custom SEO Meta Title',
  })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiProperty({
    example: 'Dapatkan tiket resmi Konser Akbar Taqwa Movement 2026 hanya di Taqtix.',
    required: false,
    description: 'Custom SEO Meta Description',
  })
  @IsString()
  @IsOptional()
  seoDescription?: string;

  @ApiProperty({
    example: 'konser musik, taqwa movement, festival islam 2026, tiket jakarta',
    required: false,
    description: 'SEO Keywords dari EO (koma terpisah)',
  })
  @IsString()
  @IsOptional()
  seoKeywords?: string;

  @ApiProperty({
    example: 'Taqtix Official, Tiket Resmi Jakarta, Promo Spesial',
    required: false,
    description: 'Platform SEO Booster Keywords dari Main Admin',
  })
  @IsString()
  @IsOptional()
  adminSeoKeywords?: string;

  @ApiProperty({
    example: 'NORMAL',
    required: false,
    description: 'Prioritas SEO Platform (NORMAL / HIGH / MAX_BOOST)',
  })
  @IsString()
  @IsOptional()
  seoPriority?: string;
}
