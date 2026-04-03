import {
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AdminController } from '../src/admin/admin.controller';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { TokenService } from '../src/auth/token.service';
import { AuthController } from '../src/auth/auth.controller';
import { UserRole } from '../src/users/enums/user-role.enum';

describe('AdminController (integration)', () => {
  let app: INestApplication;
  let authController: AuthController;
  let adminController: AdminController;
  let tokenService: TokenService;
  let rolesGuard: RolesGuard;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_PATH = ':memory:';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'admin-password-123';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authController = app.get(AuthController);
    adminController = app.get(AdminController);
    tokenService = app.get(TokenService);
    rolesGuard = app.get(RolesGuard);
  });

  afterEach(async () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    await app.close();
  });

  function createExecutionContext(role: UserRole): ExecutionContext {
    const handler = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'getAdminPing',
    )?.value as () => unknown;

    return {
      getClass: () => AdminController,
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            sub: 'user-id',
            email:
              role === UserRole.ADMIN
                ? 'admin@example.com'
                : 'user@example.com',
            role,
          },
        }),
      }),
    } as ExecutionContext;
  }

  it('seeded admin can access the admin proof endpoint', async () => {
    const authResponse = await authController.authenticateWithEmail({
      email: 'admin@example.com',
      password: 'admin-password-123',
    });

    const currentUser = await tokenService.verifyAccessToken(
      authResponse.accessToken,
    );

    expect(
      rolesGuard.canActivate(createExecutionContext(currentUser.role)),
    ).toBe(true);
    expect(adminController.getAdminPing()).toEqual({
      message: 'Admin access confirmed.',
      role: UserRole.ADMIN,
    });
  });

  it('normal authenticated user gets 403', async () => {
    await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });

    expect(() =>
      rolesGuard.canActivate(createExecutionContext(UserRole.USER)),
    ).toThrow(ForbiddenException);
  });

  it('missing or invalid access token gets 401', async () => {
    await expect(tokenService.verifyAccessToken('')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      tokenService.verifyAccessToken('invalid-access-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('app starts normally when admin seed env vars are absent', async () => {
    await app.close();
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authController = app.get(AuthController);
    tokenService = app.get(TokenService);
    adminController = app.get(AdminController);
    rolesGuard = app.get(RolesGuard);

    const authResponse = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });

    const currentUser = await tokenService.verifyAccessToken(
      authResponse.accessToken,
    );

    expect(currentUser.role).toBe(UserRole.USER);
    expect(adminController).toBeDefined();
    expect(rolesGuard).toBeDefined();
  });
});
