import {
  ExecutionContext,
  ForbiddenException,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AuthController } from '../src/auth/auth.controller';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { AdminUsersController } from '../src/users/admin-users.controller';
import { UserRole } from '../src/users/enums/user-role.enum';

describe('AdminUsersController (integration)', () => {
  let app: INestApplication;
  let authController: AuthController;
  let adminUsersController: AdminUsersController;
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
    adminUsersController = app.get(AdminUsersController);
    rolesGuard = app.get(RolesGuard);
  });

  afterEach(async () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    await app.close();
  });

  function createAdminExecutionContext(role: UserRole): ExecutionContext {
    const handler = Object.getOwnPropertyDescriptor(
      AdminUsersController.prototype,
      'getAdminUsers',
    )?.value as () => unknown;

    return {
      getClass: () => AdminUsersController,
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            sub: 'user-id',
            email:
              role === UserRole.ADMIN
                ? 'admin@example.com'
                : 'traveler@example.com',
            role,
          },
        }),
      }),
    } as ExecutionContext;
  }

  it('admin can list users and update user status and role', async () => {
    const traveler = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });
    const usersBeforeUpdate = await adminUsersController.getAdminUsers();
    const updatedUser = await adminUsersController.updateAdminUser(
      traveler.user.id,
      {
        sub: 'admin-bootstrap',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      },
      {
        isActive: false,
        role: UserRole.ADMIN,
      },
    );

    expect(usersBeforeUpdate.some((user) => user.id === traveler.user.id)).toBe(true);
    expect(updatedUser.isActive).toBe(false);
    expect(updatedUser.role).toBe(UserRole.ADMIN);
  });

  it('normal users cannot access admin user routes', async () => {
    expect(() =>
      rolesGuard.canActivate(createAdminExecutionContext(UserRole.USER)),
    ).toThrow(ForbiddenException);
  });
});
