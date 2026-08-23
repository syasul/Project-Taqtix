import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartnerType } from '@prisma/client';

export class CreateAffiliateDto {
  @ApiProperty({
    example: 'Sponsor Utama',
    description: 'Nama partner afiliasi',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nama partner tidak boleh kosong' })
  name!: string;

  @ApiProperty({
    example: 'partner@example.com',
    required: false,
    description: 'Email partner untuk login portal',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    enum: PartnerType,
    example: PartnerType.INFLUENCER,
    description: 'Tipe partner',
  })
  @IsEnum(PartnerType, { message: 'Tipe partner tidak valid' })
  type!: PartnerType;

  @ApiProperty({
    example: 10,
    required: false,
    description: 'Persentase komisi partner',
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionPct?: number;

  @ApiProperty({
    example: 'SPONSOR10',
    required: false,
    description: 'Kode promo yang diasosiasikan',
  })
  @IsString()
  @IsOptional()
  promoCode?: string;
}
