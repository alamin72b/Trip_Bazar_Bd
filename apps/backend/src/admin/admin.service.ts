import { Injectable } from '@nestjs/common';
import { AdminPingResponseDto } from './dto/admin-ping-response.dto';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class AdminService {
  getPingResponse(): AdminPingResponseDto {
    return {
      message: 'Admin access confirmed.',
      role: UserRole.ADMIN,
    };
  }
}
