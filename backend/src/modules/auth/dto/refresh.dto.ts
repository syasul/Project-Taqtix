import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object untuk perpanjangan token.
 */
export class RefreshDto {
  @ApiProperty({
    example: 'jwt-refresh-token-here',
    description: 'Refresh token yang masih valid',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token tidak boleh kosong' })
  refreshToken!: string;
}
