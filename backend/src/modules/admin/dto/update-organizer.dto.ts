import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizerDto {
  @ApiPropertyOptional({
    example: 'Nusantara Creative EO Baru',
    description: 'Nama penyelenggara',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: '08123456789',
    description: 'Nomor telepon/WhatsApp organizer',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Status akun organizer (active, pending, suspended)',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'EVENT_BUILDER',
    description: 'Segmentasi bisnis organizer',
  })
  @IsString()
  @IsOptional()
  segment?: string;

  @ApiPropertyOptional({
    example: 'ENTERPRISE_CUSTOM',
    description: 'Paket langganan/plan',
  })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiPropertyOptional({
    example: '2027-12-31T23:59:59Z',
    description: 'Tanggal kedaluwarsa plan',
  })
  @IsDateString({}, { message: 'Format tanggal planExpiresAt tidak valid' })
  @IsOptional()
  planExpiresAt?: string;

  @ApiPropertyOptional({
    example: 'Mandiri - 987654321 a.n PT Nusantara',
    description: 'Rekening bank',
  })
  @IsString()
  @IsOptional()
  bankAccount?: string;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Default Internet fee per tiket (Rp)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  internetFee?: number;
}
