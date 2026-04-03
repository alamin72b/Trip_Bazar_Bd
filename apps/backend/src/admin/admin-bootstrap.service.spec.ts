import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PasswordService } from '../auth/password.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { AdminBootstrapService } from './admin-bootstrap.service';

describe('AdminBootstrapService', () => {
  let adminBootstrapService: AdminBootstrapService;
  let usersService: jest.Mocked<UsersService>;
  let passwordService: jest.Mocked<PasswordService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminBootstrapService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const values: Record<string, string> = {
                'admin.seedEmail': 'Admin@Example.com',
                'admin.seedPassword': 'admin-password-123',
              };

              return values[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            createUser: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hashPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    adminBootstrapService = module.get(AdminBootstrapService);
    usersService = module.get(UsersService);
    passwordService = module.get(PasswordService);
  });

  it('creates an admin when seed env values are present and user does not exist', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    passwordService.hashPassword.mockResolvedValue('hashed-admin-password');
    usersService.createUser.mockResolvedValue({
      id: 'admin-id',
      email: 'admin@example.com',
      passwordHash: 'hashed-admin-password',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await adminBootstrapService.onApplicationBootstrap();

    expect(usersService.findByEmail.mock.calls[0]).toEqual([
      'admin@example.com',
    ]);
    expect(usersService.createUser.mock.calls[0]?.[0]).toEqual({
      email: 'admin@example.com',
      passwordHash: 'hashed-admin-password',
      role: UserRole.ADMIN,
    });
  });

  it('does not create a duplicate admin when the user already exists', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'existing-admin-id',
      email: 'admin@example.com',
      passwordHash: 'existing-password-hash',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await adminBootstrapService.onApplicationBootstrap();

    expect(usersService.createUser.mock.calls).toHaveLength(0);
  });

  it('does not overwrite an existing account password', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'existing-user-id',
      email: 'admin@example.com',
      passwordHash: 'existing-password-hash',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await adminBootstrapService.onApplicationBootstrap();

    expect(passwordService.hashPassword.mock.calls).toHaveLength(0);
    expect(usersService.createUser.mock.calls).toHaveLength(0);
  });
});
