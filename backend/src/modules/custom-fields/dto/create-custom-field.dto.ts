import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCustomFieldDto {
  @ApiProperty({ description: 'Label pertanyaan formulir' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    enum: ['text', 'number', 'dropdown', 'checkbox', 'date'],
    description: 'Tipe input field',
  })
  @IsEnum(['text', 'number', 'dropdown', 'checkbox', 'date'])
  fieldType: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';

  @ApiPropertyOptional({
    type: [String],
    description: 'Pilihan opsi jika fieldType dropdown atau checkbox',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ default: false, description: 'Wajib diisi atau opsional' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ default: 0, description: 'Urutan tampilan formulir' })
  @IsOptional()
  @IsNumber()
  order?: number;
}
