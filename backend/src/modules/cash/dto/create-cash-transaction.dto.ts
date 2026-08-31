import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCashTransactionDto {
  @ApiProperty({
    enum: ['ticket_sale', 'merchandise_sale', 'facility_sale', 'other'],
    description: 'Tipe transaksi kas masuk',
  })
  @IsEnum(['ticket_sale', 'merchandise_sale', 'facility_sale', 'other'])
  type: 'ticket_sale' | 'merchandise_sale' | 'facility_sale' | 'other';

  @ApiProperty({ description: 'Nominal kas (Rupiah)' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'ID order terkait jika ada' })
  @IsOptional()
  @IsString()
  relatedOrderId?: string;

  @ApiPropertyOptional({ description: 'ID transaksi POS terkait jika ada' })
  @IsOptional()
  @IsString()
  relatedPosTransactionId?: string;

  @ApiPropertyOptional({ description: 'Catatan tambahan' })
  @IsOptional()
  @IsString()
  note?: string;
}
