import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkforceDto {
  @ApiProperty({ example: 'Ahmad Fauzi', description: 'Nama crew / staff event' })
  @IsString()
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name!: string;

  @ApiProperty({ example: '08123456789', description: 'Nomor telepon / WhatsApp' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  phone!: string;

  @ApiProperty({ example: 'Ticketing & Gate', description: 'Divisi kerja kru' })
  @IsString()
  @IsNotEmpty({ message: 'Divisi tidak boleh kosong' })
  division!: string;

  @ApiProperty({ example: 'Scanner Operator', description: 'Peran tugas kru' })
  @IsString()
  @IsNotEmpty({ message: 'Role/peran tidak boleh kosong' })
  role!: string;

  @ApiPropertyOptional({ example: 'user-uuid-pic', description: 'ID User PIC supervisor (jika ada)' })
  @IsString()
  @IsOptional()
  picUserId?: string;
}
