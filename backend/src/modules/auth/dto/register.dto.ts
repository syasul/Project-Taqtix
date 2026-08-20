import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object untuk registrasi user baru.
 */
export class RegisterDto {
  @ApiProperty({
    example: 'buyer@taqtix.id',
    description: 'Alamat email user baru',
  })
  @IsEmail({}, { message: 'Alamat email tidak valid' })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Kata sandi user baru (min 6 karakter)',
  })
  @IsString()
  @MinLength(6, { message: 'Kata sandi minimal harus terdiri dari 6 karakter' })
  password!: string;

  @ApiProperty({
    example: 'buyer',
    description: 'Role user: buyer, organizer, gate_staff, atau partner',
  })
  @IsString()
  @IsIn(['buyer', 'organizer', 'gate_staff', 'partner'], {
    message: 'Role harus berupa buyer, organizer, gate_staff, atau partner',
  })
  role!: string;
}
