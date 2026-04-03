import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AuthController } from '../src/auth/auth.controller';
import { TokenService } from '../src/auth/token.service';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let authController: AuthController;
  let tokenService: TokenService;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authController = app.get(AuthController);
    tokenService = app.get(TokenService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates and logs in a new user through the email auth flow', async () => {
    const response = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });

    expect(typeof response.accessToken).toBe('string');
    expect(typeof response.refreshToken).toBe('string');
    expect(response.user).toEqual(
      expect.objectContaining({
        email: 'traveler@example.com',
        role: 'user',
        isActive: true,
      }),
    );
  });

  it('logs in an existing user when the password matches', async () => {
    const firstResponse = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });

    const secondResponse = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });

    expect(secondResponse.user.id).toBe(firstResponse.user.id);
  });

  it('does not create a second account for a differently cased email', async () => {
    const firstResponse = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });

    const secondResponse = await authController.authenticateWithEmail({
      email: 'TRAVELER@EXAMPLE.COM',
      password: 'strong-password-123',
    });

    expect(secondResponse.user.id).toBe(firstResponse.user.id);
    expect(secondResponse.user.email).toBe('traveler@example.com');
  });

  it('rejects the wrong password for an existing user', async () => {
    await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });

    await expect(
      authController.authenticateWithEmail({
        email: 'traveler@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the authenticated user profile from a valid access token', async () => {
    const authResponse = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });

    const currentUser = await tokenService.verifyAccessToken(
      authResponse.accessToken,
    );
    const profile = await authController.getCurrentUserProfile(currentUser);

    expect(profile).toEqual(
      expect.objectContaining({
        id: authResponse.user.id,
        email: 'traveler@example.com',
        role: 'user',
      }),
    );
  });

  it('rejects missing or invalid access tokens', async () => {
    await expect(tokenService.verifyAccessToken('')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      tokenService.verifyAccessToken('invalid-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates the refresh token and revokes the old one', async () => {
    const authResponse = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });

    const refreshResponse = await authController.refreshTokens({
      refreshToken: authResponse.refreshToken,
    });

    expect(refreshResponse.refreshToken).not.toBe(authResponse.refreshToken);

    await expect(
      authController.refreshTokens({
        refreshToken: authResponse.refreshToken,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
