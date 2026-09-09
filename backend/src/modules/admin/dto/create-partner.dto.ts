import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePartnerDto {
  @ApiProperty({ example: 'Raffi Ahmad Ambassador', description: 'Nama partner afiliasi' })
  @IsString()
  @IsNotEmpty({ message: 'Nama partner tidak boleh kosong' })
  name!: string;

  @ApiProperty({ example: 'event-uuid-1234', description: 'ID Event yang dipromosikan' })
  @IsString()
  @IsNotEmpty({ message: 'Event ID tidak boleh kosong' })
  eventId!: string;

  @ApiPropertyOptional({
    example: 'INFLUENCER',
    enum: ['AMBASSADOR', 'COMMUNITY', 'INFLUENCER', 'CORPORATE'],
    description: 'Tipe kategori partner',
  })
  @IsIn(['AMBASSADOR', 'COMMUNITY', 'INFLUENCER', 'CORPORATE'], {
    message: 'Tipe partner harus salah satu dari: AMBASSADOR, COMMUNITY, INFLUENCER, CORPORATE',
  })
  @IsOptional()
  type?: 'AMBASSADOR' | 'COMMUNITY' | 'INFLUENCER' | 'CORPORATE';

  @ApiProperty({ example: 'RAF50', description: 'Kode unik referral' })
  @IsString()
  @IsNotEmpty({ message: 'Kode unik referral tidak boleh kosong' })
  uniqueCode!: string;

  @ApiPropertyOptional({ example: 'PROMORAF', description: 'Kode voucher diskon' })
  @IsString()
  @IsOptional()
  promoCode?: string;

  @ApiPropertyOptional({ example: 'percentage', description: 'Tipe komisi (percentage / fixed)' })
  @IsString()
  @IsOptional()
  commissionType?: string;

  @ApiPropertyOptional({ example: 10, description: 'Besaran komisi' })
  @IsNumber({}, { message: 'Nilai komisi harus berupa angka' })
  @Min(0, { message: 'Komisi tidak boleh bernilai negatif' })
  @IsOptional()
  commissionValue?: number;

  @ApiPropertyOptional({ example: 'raffi@partner.com', description: 'Email partner' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'PartnerSecret123', description: 'Password akun portal partner' })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: '3201234567890001', description: 'Nomor KTP / NIK partner' })
  @IsString()
  @IsOptional()
  idCardNumber?: string;

  @ApiPropertyOptional({ example: 'BCA', description: 'Nama Bank pencairan komisi' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ example: '8820192831', description: 'Nomor Rekening bank' })
  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'Budi Santoso', description: 'Nama pemilik rekening bank' })
  @IsString()
  @IsOptional()
  bankAccountName?: string;
}
