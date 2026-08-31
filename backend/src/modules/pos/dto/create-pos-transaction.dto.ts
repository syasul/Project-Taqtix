import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PosItemDto {
  @ApiProperty({ enum: ['ticket', 'facility'], description: 'Tipe item' })
  @IsEnum(['ticket', 'facility'])
  type: 'ticket' | 'facility';

  @ApiProperty({ description: 'ID kategori tiket atau ID fasilitas' })
  @IsString()
  @IsNotEmpty()
  refId: string;

  @ApiProperty({ description: 'Nama item' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Jumlah item' })
  @IsNumber()
  @Min(1)
  qty: number;

  @ApiProperty({ description: 'Harga satuan item' })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreatePosTransactionDto {
  @ApiProperty({ type: [PosItemDto], description: 'Daftar item belanja di POS' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosItemDto)
  items: PosItemDto[];

  @ApiProperty({
    enum: ['cash', 'qris', 'debit'],
    description: 'Metode pembayaran di POS kasir',
  })
  @IsEnum(['cash', 'qris', 'debit'])
  paymentMethod: 'cash' | 'qris' | 'debit';

  @ApiPropertyOptional({ description: 'Nama pembeli (opsional)' })
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional({ description: 'Nomor WhatsApp / HP pembeli (opsional)' })
  @IsOptional()
  @IsString()
  buyerPhone?: string;
}
