import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthEmailDto } from './dto/auth-email.dto';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { AuthUserProfileDto } from './dto/auth-user-profile.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';
import { AccessTokenGuard } from './guards/access-token.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email')
  @HttpCode(200)
  @ApiOkResponse({
    type: AuthTokensResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Returned when an existing user provides the wrong password.',
  })
  authenticateWithEmail(
    @Body() authEmailDto: AuthEmailDto,
  ): Promise<AuthTokensResponseDto> {
    return this.authService.authenticateWithEmail(authEmailDto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOkResponse({
    type: AuthTokensResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Returned when the refresh token is invalid, expired, or revoked.',
  })
  refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthTokensResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    type: AuthUserProfileDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Returned when the access token is missing or invalid.',
  })
  getCurrentUserProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<AuthUserProfileDto> {
    return this.authService.getCurrentUserProfile(currentUser);
  }
}
