import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEventDto {
  @ApiProperty({ example: 'Taqwa Movement Concert 2026', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Event dakwah islam modern', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'Jakarta Convention Center, Senayan',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: '2026-09-12T13:00:00Z', required: false })
  @IsDateString({}, { message: 'Tanggal mulai tidak valid' })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2026-09-12T22:00:00Z', required: false })
  @IsDateString({}, { message: 'Tanggal selesai tidak valid' })
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    example: 'https://images.taqtix.id/banners/event1.jpg',
    required: false,
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

  @ApiProperty({ example: 'Konser Akbar Taqwa Movement 2026 - Tiket Resmi', required: false })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiProperty({ example: 'Dapatkan tiket resmi Konser Akbar Taqwa Movement 2026', required: false })
  @IsString()
  @IsOptional()
  seoDescription?: string;

  @ApiProperty({ example: 'konser musik, festival islam 2026', required: false })
  @IsString()
  @IsOptional()
  seoKeywords?: string;

  @ApiProperty({ example: 'Taqtix Official, Tiket Resmi Jakarta', required: false })
  @IsString()
  @IsOptional()
  adminSeoKeywords?: string;

  @ApiProperty({ example: 'NORMAL', required: false })
  @IsString()
  @IsOptional()
  seoPriority?: string;
}
