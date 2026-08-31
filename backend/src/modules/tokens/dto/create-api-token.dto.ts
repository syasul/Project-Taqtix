import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateApiTokenDto {
  @ApiProperty({ example: 'Integrasi Zapier', description: 'Label nama token' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: ['read:events', 'read:orders', 'read:attendance'],
    description: 'Daftar scope izin API token',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}
