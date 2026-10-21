import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketCategoryDto {
  @ApiProperty({ example: 'VIP Pass' })
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori tiket tidak boleh kosong' })
  name!: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Min(0, { message: 'Harga tidak boleh kurang dari 0' })
  price!: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1, { message: 'Kuota minimal harus 1' })
  quota!: number;

  @ApiProperty({ example: 1, required: false, description: 'Jumlah tiket/orang per paket (contoh: 2 untuk Couple)' })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Jumlah tiket per paket minimal 1' })
  ticketPerPackage?: number;

  @ApiProperty({ example: '2026-08-01T00:00:00Z' })
  @IsDateString({}, { message: 'Tanggal mulai penjualan tidak valid' })
  saleStart!: string;

  @ApiProperty({ example: '2026-09-10T23:59:59Z' })
  @IsDateString({}, { message: 'Tanggal akhir penjualan tidak valid' })
  saleEnd!: string;
}
