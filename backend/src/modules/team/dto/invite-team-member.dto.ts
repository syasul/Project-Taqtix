import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteTeamMemberDto {
  @ApiProperty({ example: 'colleague@organizer.id', description: 'Email anggota tim yang diundang' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email!: string;

  @ApiProperty({ example: 'finance', description: 'Peran / hak akses di organizer' })
  @IsString()
  @IsNotEmpty({ message: 'Peran (role) tidak boleh kosong' })
  role!: string;
}
