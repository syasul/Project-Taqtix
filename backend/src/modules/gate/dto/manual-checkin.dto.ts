import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualCheckinDto {
  @ApiProperty({
    example: 'ticket-uuid-or-code',
    description: 'ID tiket atau kode tiket unik',
  })
  @IsString()
  @IsNotEmpty({ message: 'Kode tiket tidak boleh kosong' })
  code!: string;

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
