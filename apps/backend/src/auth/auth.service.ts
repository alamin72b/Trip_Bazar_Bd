import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { normalizeEmail } from '../common/utils/normalize-email.util';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { AuthEmailDto } from './dto/auth-email.dto';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { AuthUserProfileDto } from './dto/auth-user-profile.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshTokenRecord } from './entities/refresh-token-record.entity';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    @InjectRepository(RefreshTokenRecord)
    private readonly refreshTokensRepository: Repository<RefreshTokenRecord>,
  ) {}

  async authenticateWithEmail(
    authEmailDto: AuthEmailDto,
  ): Promise<AuthTokensResponseDto> {
    const normalizedEmail = normalizeEmail(authEmailDto.email);
    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (!existingUser) {
      return this.registerAndAuthenticate(
        normalizedEmail,
        authEmailDto.password,
      );
    }

    return this.loginExistingUser(existingUser, authEmailDto.password);
  }

  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthTokensResponseDto> {
    const refreshTokenPayload = await this.tokenService.verifyRefreshToken(
      refreshTokenDto.refreshToken,
    );

    const refreshTokenRecord = await this.refreshTokensRepository.findOne({
      where: {
        tokenId: refreshTokenPayload.jti,
      },
      relations: {
        user: true,
      },
    });

    if (
      !refreshTokenRecord ||
      refreshTokenRecord.userId !== refreshTokenPayload.sub ||
      refreshTokenRecord.revokedAt ||
      refreshTokenRecord.expiresAt <= new Date() ||
      !this.tokenService.compareRefreshToken(
        refreshTokenDto.refreshToken,
        refreshTokenRecord.tokenHash,
      )
    ) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (!refreshTokenRecord.user.isActive) {
      throw new ForbiddenException('This account is inactive.');
    }

    refreshTokenRecord.revokedAt = new Date();
    await this.refreshTokensRepository.save(refreshTokenRecord);

    return this.buildAuthResponse(refreshTokenRecord.user);
  }

  async getCurrentUserProfile(
    currentUser: AuthenticatedUser,
  ): Promise<AuthUserProfileDto> {
    const user = await this.usersService.findById(currentUser.sub);

    if (!user) {
      throw new UnauthorizedException('Authenticated user no longer exists.');
    }

    return this.buildUserProfile(user);
  }

  private async registerAndAuthenticate(
    email: string,
    password: string,
  ): Promise<AuthTokensResponseDto> {
    const passwordHash = await this.passwordService.hashPassword(password);
    let user: User;

    try {
      user = await this.usersService.createUser({
        email,
        passwordHash,
        role: UserRole.USER,
      });
    } catch (error) {
      const existingUser = await this.usersService.findByEmail(email);

      if (!existingUser) {
        throw error;
      }

      return this.loginExistingUser(existingUser, password);
    }

    return this.buildAuthResponse(user);
  }

  private async loginExistingUser(
    user: User,
    password: string,
  ): Promise<AuthTokensResponseDto> {
    if (!user.isActive) {
      throw new ForbiddenException('This account is inactive.');
    }

    const passwordMatches = await this.passwordService.comparePassword(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: User): Promise<AuthTokensResponseDto> {
    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const issuedRefreshToken = await this.tokenService.signRefreshToken(
      user.id,
    );
    const refreshTokenRecord = this.refreshTokensRepository.create({
      userId: user.id,
      tokenId: issuedRefreshToken.tokenId,
      tokenHash: this.tokenService.hashRefreshToken(issuedRefreshToken.token),
      expiresAt: issuedRefreshToken.expiresAt,
      revokedAt: null,
    });

    await this.refreshTokensRepository.save(refreshTokenRecord);

    return {
      accessToken,
      refreshToken: issuedRefreshToken.token,
      user: this.buildUserProfile(user),
    };
  }

  private buildUserProfile(user: User): AuthUserProfileDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
