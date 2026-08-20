import { IsString, IsOptional, IsNumber, Min, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTicketCategoryDto {
  @ApiProperty({ example: 'VIP Pass (Updated)', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 175000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 120, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quota?: number;

  @ApiProperty({ example: '2026-08-01T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  saleStart?: string;

  @ApiProperty({ example: '2026-09-10T23:59:59Z', required: false })
  @IsDateString()
  @IsOptional()
  saleEnd?: string;
}
