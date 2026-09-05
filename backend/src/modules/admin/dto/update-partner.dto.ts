import {
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePartnerDto {
  @ApiPropertyOptional({ example: 'Raffi Ahmad Official', description: 'Nama partner afiliasi' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'event-uuid-5678', description: 'ID Event yang dipromosikan' })
  @IsString()
  @IsOptional()
  eventId?: string;

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

  @ApiPropertyOptional({ example: 'RAFFI2026', description: 'Kode unik referral' })
  @IsString()
  @IsOptional()
  uniqueCode?: string;

  @ApiPropertyOptional({ example: 'DISKONRAF', description: 'Kode voucher diskon' })
  @IsString()
  @IsOptional()
  promoCode?: string;

  @ApiPropertyOptional({ example: 'fixed', description: 'Tipe komisi (percentage / fixed)' })
  @IsString()
  @IsOptional()
  commissionType?: string;

  @ApiPropertyOptional({ example: 25000, description: 'Besaran komisi' })
  @IsNumber({}, { message: 'Nilai komisi harus berupa angka' })
  @Min(0, { message: 'Komisi tidak boleh bernilai negatif' })
  @IsOptional()
  commissionValue?: number;

  @ApiPropertyOptional({ example: 'raffi.new@partner.com', description: 'Email partner' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsOptional()
  email?: string;
}
