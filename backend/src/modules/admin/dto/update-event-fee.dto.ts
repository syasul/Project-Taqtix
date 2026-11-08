import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TicketCategoryFeeItemDto {
  @ApiProperty({ description: 'ID Ticket Category' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Internet Fee per tiket untuk kategori ini (Rp)' })
  @IsNumber()
  @Min(0)
  internetFee: number;
}

export class UpdateEventFeeDto {
  @ApiProperty({ description: 'Default Internet Fee per tiket untuk event ini (Rp)' })
  @IsNumber()
  @Min(0)
  internetFee: number;

  @ApiPropertyOptional({ description: 'Jika true, terapkan biaya ini ke seluruh kategori tiket event' })
  @IsBoolean()
  @IsOptional()
  applyToAllCategories?: boolean;

  @ApiPropertyOptional({ description: 'Pengaturan biaya kustom per kategori/tier', type: [TicketCategoryFeeItemDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TicketCategoryFeeItemDto)
  categories?: TicketCategoryFeeItemDto[];
}

