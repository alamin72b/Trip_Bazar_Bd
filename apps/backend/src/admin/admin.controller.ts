import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { AdminService } from './admin.service';
import { AdminPingResponseDto } from './dto/admin-ping-response.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('ping')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({
    type: AdminPingResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Returned when the access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'Returned when the authenticated user is not an admin.',
  })
  getAdminPing(): AdminPingResponseDto {
    return this.adminService.getPingResponse();
  }
}
