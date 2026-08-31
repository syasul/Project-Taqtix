import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class DrawDoorprizeDto {
  @ApiPropertyOptional({
    default: true,
    description: 'Kecualikan pemenang yang sudah pernah menang di hadiah sebelumnya',
  })
  @IsOptional()
  @IsBoolean()
  excludeWinnersFromPreviousDraws?: boolean;
}
