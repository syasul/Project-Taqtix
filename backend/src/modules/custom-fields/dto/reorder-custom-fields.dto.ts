import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ReorderCustomFieldsDto {
  @ApiProperty({
    type: [String],
    description: 'Array ID formulir dengan urutan baru',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  orderedIds: string[];
}
