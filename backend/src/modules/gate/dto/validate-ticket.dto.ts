import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateTicketDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Payload signed QR token',
  })
  @IsString()
  @IsNotEmpty({ message: 'QR payload tidak boleh kosong' })
  qrPayload!: string;

  @ApiProperty({
    example: 'in',
    description: 'Aksi pemindaian: "in" untuk masuk, "out" untuk keluar',
    required: false,
    default: 'in',
  })
  @IsString()
  @IsOptional()
  action?: 'in' | 'out';
}
