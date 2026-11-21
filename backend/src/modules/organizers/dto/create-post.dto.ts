import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Pengumuman Lineup Fase 2 Resmi Rilis!' })
  @IsString()
  @IsNotEmpty({ message: 'Judul kabar tidak boleh kosong' })
  title!: string;

  @ApiProperty({ example: 'Halo para festival goers, kami sangat antusias mengumumkan lineup tambahan...' })
  @IsString()
  @IsNotEmpty({ message: 'Konten kabar tidak boleh kosong' })
  content!: string;

  @ApiPropertyOptional({ example: 'https://taqtix.id/uploads/poster-lineup.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'uuid-event-id' })
  @IsString()
  @IsOptional()
  eventId?: string;
}
