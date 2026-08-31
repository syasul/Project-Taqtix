import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLineupDto {
  @ApiProperty({ example: 'Sheila on 7', description: 'Nama artis / performer' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'URL foto artis' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ example: '20:00 - 21:30', description: 'Jadwal tampil artis' })
  @IsOptional()
  @IsString()
  performTime?: string;

  @ApiPropertyOptional({ example: 'Main Stage', description: 'Panggung / venue tampil' })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional({ default: 0, description: 'Urutan tampil' })
  @IsOptional()
  @IsNumber()
  order?: number;
}
