import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlanDto {
  @ApiProperty({ example: 'pro', description: 'Paket langganan organizer (starter | pro | enterprise)' })
  @IsString()
  @IsNotEmpty({ message: 'Plan tidak boleh kosong' })
  plan!: string;
}
