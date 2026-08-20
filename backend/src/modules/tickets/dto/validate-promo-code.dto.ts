import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidatePromoCodeDto {
  @ApiProperty({
    example: 'MERDEKA80',
    description: 'Kode promo yang diinput pembeli',
  })
  @IsString()
  @IsNotEmpty({ message: 'Kode promo tidak boleh kosong' })
  code!: string;

  @ApiProperty({ example: 'event-uuid-here', description: 'ID event terkait' })
  @IsString()
  @IsNotEmpty({ message: 'Event ID tidak boleh kosong' })
  eventId!: string;
}
