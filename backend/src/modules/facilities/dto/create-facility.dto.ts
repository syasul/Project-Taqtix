import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateFacilityDto {
  @ApiProperty({ example: 'Merchandise Bundle', description: 'Nama fasilitas / addon' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Deskripsi fasilitas' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0, description: 'Harga fasilitas dalam Rupiah (0 = gratis)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Batas kuota stok fasilitas (null = unlimited)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quota?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'ID kategori tiket yang boleh membeli fasilitas ini (null = semua kategori)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableTicketCategoryIds?: string[];
}
