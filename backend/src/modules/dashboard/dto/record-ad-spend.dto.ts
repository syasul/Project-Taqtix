import { IsDateString, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordAdSpendDto {
  @ApiProperty({ example: 'Meta Ads (Instagram & Facebook)', description: 'Kanal periklanan' })
  @IsString()
  @IsNotEmpty({ message: 'Kanal iklan tidak boleh kosong' })
  channel!: string;

  @ApiProperty({ example: 1500000, description: 'Biaya pengeluaran iklan (Rp)' })
  @IsNumber({}, { message: 'Biaya iklan harus berupa angka' })
  @Min(0, { message: 'Biaya iklan tidak boleh negatif' })
  amount!: number;

  @ApiProperty({ example: '2026-09-01T00:00:00Z', description: 'Tanggal mulai periode iklan' })
  @IsDateString({}, { message: 'Format periodStart tidak valid' })
  periodStart!: string;

  @ApiProperty({ example: '2026-09-07T23:59:59Z', description: 'Tanggal akhir periode iklan' })
  @IsDateString({}, { message: 'Format periodEnd tidak valid' })
  periodEnd!: string;
}
