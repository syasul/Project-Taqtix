import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestTransferDto {
  @ApiProperty({ example: 'Budi Santoso', description: 'Nama lengkap penerima tiket' })
  @IsString()
  @IsNotEmpty()
  toName: string;

  @ApiProperty({ example: 'budi@example.com', description: 'Email penerima tiket' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  toEmail: string;

  @ApiProperty({ example: '081298765432', description: 'Nomor WhatsApp penerima tiket' })
  @IsString()
  @IsNotEmpty()
  toPhone: string;
}
