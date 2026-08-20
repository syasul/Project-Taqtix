import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualCheckinDto {
  @ApiProperty({
    example: 'ticket-uuid-or-code',
    description: 'ID tiket atau kode tiket unik',
  })
  @IsString()
  @IsNotEmpty({ message: 'Kode tiket tidak boleh kosong' })
  code!: string;
}
