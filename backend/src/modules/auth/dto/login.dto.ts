import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object untuk login kredensial email & password.
 */
export class LoginDto {
  @ApiProperty({
    example: 'organizer@taqtix.id',
    description: 'Email pengguna',
  })
  @IsEmail({}, { message: 'Alamat email tidak valid' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Kata sandi' })
  @IsString()
  @MinLength(6, { message: 'Kata sandi minimal harus terdiri dari 6 karakter' })
  password!: string;

  @ApiProperty({
    example: 'device-uuid-1234',
    description: 'Unique identifier of the device',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceId?: string;
}
