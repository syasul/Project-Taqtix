import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizerDto {
  @ApiPropertyOptional({ example: 'Nusantara Creative EO Baru', description: 'Nama penyelenggara' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'ENTERPRISE', description: 'Segmentasi bisnis organizer' })
  @IsString()
  @IsOptional()
  segment?: string;

  @ApiPropertyOptional({ example: 'ENTERPRISE_CUSTOM', description: 'Paket langganan/plan' })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiPropertyOptional({ example: '2027-12-31T23:59:59Z', description: 'Tanggal kedaluwarsa plan' })
  @IsDateString({}, { message: 'Format tanggal planExpiresAt tidak valid' })
  @IsOptional()
  planExpiresAt?: string;

  @ApiPropertyOptional({ example: 'Mandiri - 987654321 a.n PT Nusantara', description: 'Rekening bank' })
  @IsString()
  @IsOptional()
  bankAccount?: string;
}
