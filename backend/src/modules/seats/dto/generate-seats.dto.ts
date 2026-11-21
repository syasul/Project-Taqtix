import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSeatsDto {
  @ApiProperty({
    example: 'VIP Tengah',
    description: 'Nama seksi denah panggung',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nama seksi tidak boleh kosong' })
  sectionName!: string;

  @ApiProperty({
    example: 'cat-uuid-1234',
    required: false,
    description: 'ID Kategori/Tier tiket yang diasosiasikan dengan seksi ini',
  })
  @IsString()
  @IsOptional()
  ticketCategoryId?: string;

  @ApiProperty({
    example: 'CENTER',
    default: 'CENTER',
    description: 'Posisi seksi terhadap panggung (TOP, BOTTOM, LEFT, RIGHT, CENTER)',
  })
  @IsString()
  @IsOptional()
  stagePosition?: string;

  @ApiProperty({
    example: 'A',
    description: 'Huruf atau angka baris awal (misal: "A" atau "1")',
  })
  @IsString()
  @IsNotEmpty({ message: 'Baris awal tidak boleh kosong' })
  rowStart!: string;

  @ApiProperty({
    example: 'H',
    description: 'Huruf atau angka baris akhir (misal: "H" atau "8")',
  })
  @IsString()
  @IsNotEmpty({ message: 'Baris akhir tidak boleh kosong' })
  rowEnd!: string;

  @ApiProperty({
    example: 16,
    description: 'Jumlah kursi dalam tiap baris',
  })
  @IsNumber()
  @Min(1, { message: 'Minimal 1 kursi per baris' })
  @Max(50, { message: 'Maksimal 50 kursi per baris' })
  seatsPerRow!: number;

  @ApiProperty({
    example: [8],
    required: false,
    description: 'Nomor kolom kursi yang memiliki lorong/gang kosong setelahnya',
  })
  @IsArray()
  @IsOptional()
  aisleAfterSeats?: number[];

  @ApiProperty({
    example: ['A-1', 'A-2'],
    required: false,
    description: 'Daftar nomor kursi yang dinonaktifkan (ruang kosong/tiang/sound)',
  })
  @IsArray()
  @IsOptional()
  disabledSeatNumbers?: string[];
}
