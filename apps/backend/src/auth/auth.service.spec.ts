import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { AuthService } from './auth.service';
import { RefreshTokenRecord } from './entities/refresh-token-record.entity';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let refreshTokensRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const existingUser = {
    id: 'user-1',
    email: 'traveler@example.com',
    passwordHash: 'stored-password-hash',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date('2026-04-03T07:00:00.000Z'),
    updatedAt: new Date('2026-04-03T07:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            createUser: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hashPassword: jest.fn(),
            comparePassword: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            signAccessToken: jest.fn(),
            signRefreshToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
            hashRefreshToken: jest.fn(),
            compareRefreshToken: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshTokenRecord),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn((value) => value),
            save: jest.fn(),
          } satisfies Partial<Repository<RefreshTokenRecord>>,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    passwordService = module.get(PasswordService);
    tokenService = module.get(TokenService);
    refreshTokensRepository = module.get(
      getRepositoryToken(RefreshTokenRecord),
    );

    tokenService.signAccessToken.mockResolvedValue('access-token');
    tokenService.signRefreshToken.mockResolvedValue({
      token: 'refresh-token',
      tokenId: 'refresh-token-id',
      expiresAt: new Date('2026-04-10T07:00:00.000Z'),
    });
    tokenService.hashRefreshToken.mockReturnValue('refresh-token-hash');
    refreshTokensRepository.save.mockResolvedValue(undefined);
  });

  it('hashes the password and assigns the default role when creating a new user', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    passwordService.hashPassword.mockResolvedValue('hashed-password');
    usersService.createUser.mockResolvedValue(existingUser);

    const response = await authService.authenticateWithEmail({
      email: 'Traveler@Example.com',
      password: 'strong-password-123',
    });

    expect(usersService.createUser.mock.calls[0]?.[0]).toEqual({
      email: 'traveler@example.com',
      passwordHash: 'hashed-password',
      role: UserRole.USER,
    });
    expect(response.accessToken).toBe('access-token');
    expect(response.refreshToken).toBe('refresh-token');
    expect(response.user.email).toBe('traveler@example.com');
    expect(response.user.role).toBe(UserRole.USER);
    expect(refreshTokensRepository.save).toHaveBeenCalled();
  });

  it('issues tokens for an existing user when the password matches', async () => {
    usersService.findByEmail.mockResolvedValue(existingUser);
    passwordService.comparePassword.mockResolvedValue(true);

    const response = await authService.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });

    expect(passwordService.comparePassword.mock.calls[0]).toEqual([
      'strong-password-123',
      existingUser.passwordHash,
    ]);
    expect(usersService.createUser.mock.calls).toHaveLength(0);
    expect(response.accessToken).toBe('access-token');
    expect(response.refreshToken).toBe('refresh-token');
  });

  it('returns 401 for an existing user with the wrong password', async () => {
    usersService.findByEmail.mockResolvedValue(existingUser);
    passwordService.comparePassword.mockResolvedValue(false);

    await expect(
      authService.authenticateWithEmail({
        email: 'traveler@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects refresh when the token has already been revoked', async () => {
    tokenService.verifyRefreshToken.mockResolvedValue({
      sub: existingUser.id,
      jti: 'refresh-token-id',
      type: 'refresh',
    });
    refreshTokensRepository.findOne.mockResolvedValue({
      userId: existingUser.id,
      user: existingUser,
      tokenId: 'refresh-token-id',
      tokenHash: 'refresh-token-hash',
      expiresAt: new Date('2026-04-10T07:00:00.000Z'),
      revokedAt: new Date('2026-04-04T07:00:00.000Z'),
    });

    await expect(
      authService.refreshTokens({
        refreshToken: 'refresh-token',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('blocks authentication for inactive users', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...existingUser,
      isActive: false,
    });

    await expect(
      authService.authenticateWithEmail({
        email: 'traveler@example.com',
        password: 'strong-password-123',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
