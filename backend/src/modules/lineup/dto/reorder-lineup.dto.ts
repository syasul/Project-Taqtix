import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ReorderLineupDto {
  @ApiProperty({
    type: [String],
    description: 'Array ID lineup dengan urutan baru',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  orderedIds: string[];
}
