import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/enums/user-role.enum';

export class AdminPingResponseDto {
  @ApiProperty({
    example: 'Admin access confirmed.',
  })
  message!: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  role!: UserRole;
}
