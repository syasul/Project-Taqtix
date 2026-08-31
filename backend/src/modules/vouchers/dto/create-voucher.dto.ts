import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateVoucherDto {
  @ApiPropertyOptional({ description: 'ID event jika voucher scoped ke 1 event tertentu' })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiProperty({ description: 'Kode voucher unik per organizer' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: ['percentage', 'fixed'], description: 'Tipe potongan diskon' })
  @IsEnum(['percentage', 'fixed'])
  type: 'percentage' | 'fixed';

  @ApiProperty({ description: 'Nilai diskon (persen atau nominal rupiah)' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Batas kuota penggunaan (null = unlimited)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Maksimum nominal potongan untuk diskon percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiProperty({ description: 'Waktu mulai berlaku (ISO string)' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: 'Waktu berakhir (ISO string)' })
  @IsDateString()
  validUntil: string;

  @ApiPropertyOptional({ description: 'Daftar ID event yang berlaku jika eventId null' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableEventIds?: string[];
}
