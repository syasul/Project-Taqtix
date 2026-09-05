import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizerDto {
  @ApiProperty({ example: 'Nusantara Creative EO', description: 'Nama penyelenggara/organizer' })
  @IsString()
  @IsNotEmpty({ message: 'Nama organizer tidak boleh kosong' })
  name!: string;

  @ApiProperty({ example: 'contact@nusantara.id', description: 'Email akun organizer' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiPropertyOptional({ example: 'OrganizerPassword123!', description: 'Password default jika diisi admin' })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password?: string;

  @ApiPropertyOptional({ example: '081234567890', description: 'Nomor telepon WhatsApp' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'ENTERPRISE', description: 'Segmentasi bisnis organizer' })
  @IsString()
  @IsOptional()
  segment?: string;

  @ApiPropertyOptional({ example: 'PRO', description: 'Paket langganan/plan organizer' })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiPropertyOptional({ example: 'BCA - 1234567890 a.n Nusantara', description: 'Informasi rekening bank transfer' })
  @IsString()
  @IsOptional()
  bankAccount?: string;
}
