import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FacilityOrderDto {
  @ApiProperty({ description: 'ID fasilitas/addon' })
  @IsString()
  @IsNotEmpty()
  facilityId!: string;

  @ApiProperty({ description: 'Jumlah kuantitas fasilitas' })
  @IsInt()
  @Min(1)
  qty!: number;
}

export class OrderItemDto {
  @ApiProperty({
    example: 'ticket-category-uuid-here',
    description: 'ID kategori tiket',
  })
  @IsString()
  @IsNotEmpty({ message: 'Ticket Category ID tidak boleh kosong' })
  ticketCategoryId!: string;

  @ApiProperty({
    example: 2,
    description: 'Jumlah kuantitas tiket yang dipesan',
  })
  @IsInt()
  @Min(1, { message: 'Kuantitas minimal harus 1' })
  qty!: number;

  @ApiPropertyOptional({
    description: 'Jawaban formulir kustom per kategori/item { [customFormFieldId]: string }',
  })
  @IsOptional()
  customFieldAnswers?: Record<string, string>;

  @ApiPropertyOptional({
    type: [FacilityOrderDto],
    description: 'Fasilitas yang dipilih per tiket item',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacilityOrderDto)
  facilities?: FacilityOrderDto[];
}

export class CreateOrderDto {
  @ApiProperty({ example: 'event-uuid-here', description: 'ID event terkait' })
  @IsString()
  @IsNotEmpty({ message: 'Event ID tidak boleh kosong' })
  eventId!: string;

  @ApiProperty({
    type: [OrderItemDto],
    description: 'Daftar tiket yang dibeli',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiPropertyOptional({
    type: [FacilityOrderDto],
    description: 'Fasilitas/addon level order',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacilityOrderDto)
  facilities?: FacilityOrderDto[];

  @ApiPropertyOptional({
    description: 'Jawaban formulir kustom level order { [customFormFieldId]: string }',
  })
  @IsOptional()
  customFieldAnswers?: Record<string, string>;

  @ApiProperty({
    example: 'MERDEKA80',
    required: false,
    description: 'Kode voucher / promo jika ada',
  })
  @IsString()
  @IsOptional()
  promoCode?: string;

  @ApiProperty({
    example: 'PARTNERCODE',
    required: false,
    description: 'Kode unik afiliasi jika ada',
  })
  @IsString()
  @IsOptional()
  affiliateCode?: string;

  @ApiProperty({
    example: 'buyer@example.com',
    description: 'Alamat email pembeli',
  })
  @IsEmail({}, { message: 'Alamat email tidak valid' })
  buyerEmail!: string;

  @ApiProperty({ example: 'Budi Santoso', description: 'Nama lengkap pembeli' })
  @IsString()
  @IsNotEmpty({ message: 'Nama pembeli tidak boleh kosong' })
  buyerName!: string;

  @ApiProperty({
    example: '081234567890',
    required: false,
    description: 'Nomor HP/WhatsApp pembeli',
  })
  @IsString()
  @IsOptional()
  buyerPhone?: string;

  @ApiPropertyOptional({ example: 'Jakarta', description: 'Kota domisili pembeli' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'UTM Source' })
  @IsString()
  @IsOptional()
  utmSource?: string;

  @ApiPropertyOptional({ description: 'UTM Medium' })
  @IsString()
  @IsOptional()
  utmMedium?: string;

  @ApiPropertyOptional({ description: 'UTM Campaign' })
  @IsString()
  @IsOptional()
  utmCampaign?: string;
}
