import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSegmentDto {
  @ApiProperty({ example: 'VIP Repeat Buyers', description: 'Nama segmen audiens' })
  @IsString()
  @IsNotEmpty({ message: 'Nama segmen tidak boleh kosong' })
  name!: string;

  @ApiProperty({ example: { minSpend: 500000 }, description: 'Kriteria filter dinamis segmen' })
  @IsObject({ message: 'Kriteria segmen harus berupa objek' })
  @IsNotEmpty({ message: 'Kriteria segmen tidak boleh kosong' })
  criteria!: Record<string, any>;
}
