import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromoCodeDto {
  @ApiProperty({ example: 'MERDEKA80', description: 'Kode promo unik' })
  @IsString()
  @IsNotEmpty({ message: 'Kode promo tidak boleh kosong' })
  code!: string;

  @ApiProperty({
    example: 25000,
    description: 'Nilai diskon (bisa nominal atau persentase)',
  })
  @IsNumber()
  @Min(1, { message: 'Diskon harus lebih besar dari 0' })
  discount!: number;

  @ApiProperty({
    example: 100,
    description: 'Batas maksimum penggunaan kode promo',
  })
  @IsNumber()
  @Min(1, { message: 'Maksimum penggunaan minimal 1' })
  maxUsage!: number;
}
