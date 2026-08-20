import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignGateStaffDto {
  @ApiProperty({
    example: 'staff1@taqtix.id',
    description: 'Alamat email staf yang akan didaftarkan',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email!: string;
}
