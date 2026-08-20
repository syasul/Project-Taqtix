import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Taqwa Movement Concert 2026', description: 'Judul/Nama acara' })
  @IsString()
  @IsNotEmpty({ message: 'Judul event tidak boleh kosong' })
  title!: string;

  @ApiProperty({ example: 'Stress test pertama untuk ticketing.', required: false, description: 'Deskripsi lengkap acara' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Jakarta Convention Center, Senayan', description: 'Lokasi acara' })
  @IsString()
  @IsNotEmpty({ message: 'Lokasi tidak boleh kosong' })
  location!: string;

  @ApiProperty({ example: '2026-09-12T13:00:00Z', description: 'Waktu mulai acara' })
  @IsDateString({}, { message: 'Tanggal mulai tidak valid' })
  startDate!: string;

  @ApiProperty({ example: '2026-09-12T22:00:00Z', description: 'Waktu selesai acara' })
  @IsDateString({}, { message: 'Tanggal selesai tidak valid' })
  endDate!: string;

  @ApiProperty({ example: 'https://images.taqtix.id/banners/event1.jpg', required: false, description: 'URL banner event' })
  @IsString()
  @IsOptional()
  bannerUrl?: string;
}
