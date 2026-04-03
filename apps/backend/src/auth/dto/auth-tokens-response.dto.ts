import { ApiProperty } from '@nestjs/swagger';
import { AuthUserProfileDto } from './auth-user-profile.dto';

export class AuthTokensResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({
    type: AuthUserProfileDto,
  })
  user!: AuthUserProfileDto;
}
