import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UserRole } from './enums/user-role.enum';
import { UsersService } from './users.service';

@ApiTags('Admin Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({
    type: AdminUserResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Returned when the access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'Returned when the authenticated user is not an admin.',
  })
  getAdminUsers(): Promise<AdminUserResponseDto[]> {
    return this.usersService.getAdminUsers();
  }

  @Get(':id')
  @ApiOkResponse({
    type: AdminUserResponseDto,
  })
  getAdminUserById(@Param('id') id: string): Promise<AdminUserResponseDto> {
    return this.usersService.getAdminUserById(id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: AdminUserResponseDto,
  })
  updateAdminUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() updateAdminUserDto: UpdateAdminUserDto,
  ): Promise<AdminUserResponseDto> {
    return this.usersService.updateAdminUser(id, currentUser, updateAdminUserDto);
  }
}
