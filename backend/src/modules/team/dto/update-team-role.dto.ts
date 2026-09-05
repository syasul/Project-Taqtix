import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTeamRoleDto {
  @ApiProperty({ example: 'admin', description: 'Peran baru untuk member tim' })
  @IsString()
  @IsNotEmpty({ message: 'Role tidak boleh kosong' })
  role!: string;
}
