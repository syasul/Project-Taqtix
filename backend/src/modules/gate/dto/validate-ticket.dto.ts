import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateTicketDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Payload signed QR token' })
  @IsString()
  @IsNotEmpty({ message: 'QR payload tidak boleh kosong' })
  qrPayload!: string;
}
