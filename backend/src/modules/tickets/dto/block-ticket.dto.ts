import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BlockTicketDto {
  @ApiPropertyOptional({ example: 'Indikasi tiket duplikat / fraud', description: 'Alasan pemblokiran tiket' })
  @IsOptional()
  @IsString()
  reason?: string;
}
