import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateBannerDto {
  @ApiProperty({ description: 'Judul atau headline banner promosi', example: 'Jakarta Live Fest 2026' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Subjudul atau tagline banner', example: 'Simfoni Musik Akbar Indonesia' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiProperty({ description: 'URL Gambar Banner', example: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ description: 'URL tujuan saat banner diklik', example: '/event/jakarta-live-fest-2026' })
  @IsString()
  @IsOptional()
  targetUrl?: string;

  @ApiPropertyOptional({ description: 'Posisi penempatan banner', example: 'home_hero', default: 'home_hero' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ description: 'Urutan tampilan slider banner', example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Status keaktifan banner', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

