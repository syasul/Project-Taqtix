import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBroadcastDto {
  @ApiProperty({ example: 'Halo! Dapatkan potongan 20% khusus untuk Anda...', description: 'Pesan broadcast' })
  @IsString()
  @IsNotEmpty({ message: 'Pesan broadcast tidak boleh kosong' })
  message!: string;

  @ApiPropertyOptional({ example: 'whatsapp', enum: ['whatsapp', 'email'], description: 'Kanal pengiriman' })
  @IsIn(['whatsapp', 'email'], { message: 'Kanal harus berupa whatsapp atau email' })
  @IsOptional()
  channel?: 'whatsapp' | 'email';

  @ApiPropertyOptional({ example: 'Penawaran Eksklusif Tiket TAQtix', description: 'Subjek email jika kanal email' })
  @IsString()
  @IsOptional()
  subject?: string;
}
