import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LockSeatsDto {
  @ApiProperty({
    example: ['seat-id-1', 'seat-id-2'],
    description: 'Daftar ID kursi yang ingin dikunci untuk checkout',
  })
  @IsArray()
  @IsNotEmpty({ message: 'Daftar kursi tidak boleh kosong' })
  seatIds!: string[];

  @ApiProperty({
    example: 'order-uuid-1234',
    required: false,
    description: 'ID pemesanan yang mengunci kursi ini (jika ada)',
  })
  @IsString()
  @IsOptional()
  orderId?: string;
}

export class ReleaseSeatsDto {
  @ApiProperty({
    example: ['seat-id-1', 'seat-id-2'],
    description: 'Daftar ID kursi yang ingin dilepaskan kunciannya',
  })
  @IsArray()
  @IsNotEmpty({ message: 'Daftar kursi tidak boleh kosong' })
  seatIds!: string[];

  @ApiProperty({
    example: 'order-uuid-1234',
    required: false,
  })
  @IsString()
  @IsOptional()
  orderId?: string;
}
