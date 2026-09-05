import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({ example: 'Syamsul Ma’arif', description: 'Nama calon klien / organizer' })
  @IsString()
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name!: string;

  @ApiProperty({ example: 'PT Kreasi Festival Nusantara', description: 'Nama organisasi / perusahaan' })
  @IsString()
  @IsNotEmpty({ message: 'Nama organisasi tidak boleh kosong' })
  @MaxLength(150, { message: 'Nama organisasi maksimal 150 karakter' })
  organizationName!: string;

  @ApiProperty({ example: 'syamsul@kreasifestival.id', description: 'Email narahubung' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({ example: '081234567890', description: 'Nomor telepon / WhatsApp' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  @MaxLength(30, { message: 'Nomor telepon maksimal 30 karakter' })
  phone!: string;

  @ApiProperty({ example: 'Kami ingin konsultasi tiket konser musik kapasitas 5000 orang.', description: 'Pesan kebutuhan' })
  @IsString()
  @IsNotEmpty({ message: 'Pesan tidak boleh kosong' })
  @MaxLength(2000, { message: 'Pesan maksimal 2000 karakter' })
  message!: string;
}
