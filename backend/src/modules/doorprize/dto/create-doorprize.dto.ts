import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDoorprizeDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max', description: 'Nama hadiah doorprize' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'URL gambar hadiah' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 1, description: 'Jumlah kuantitas hadiah yang diundi' })
  @IsNumber()
  @Min(1)
  quantity: number;
}
