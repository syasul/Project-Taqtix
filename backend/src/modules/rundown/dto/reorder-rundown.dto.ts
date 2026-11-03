import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class ReorderItem {
  @IsString()
  id!: string;

  @IsInt()
  order!: number;
}

export class ReorderRundownDto {
  @ApiProperty({
    description: 'Daftar ID rundown item beserta indeks urutan barunya',
    example: [{ id: 'uuid-1', order: 0 }, { id: 'uuid-2', order: 1 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items!: ReorderItem[];
}

