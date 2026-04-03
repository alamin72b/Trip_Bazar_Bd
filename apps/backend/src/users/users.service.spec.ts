import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
  };

  const adminUser: AuthenticatedUser = {
    sub: 'admin-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          } satisfies Partial<Repository<User>>,
        },
      ],
    }).compile();

    usersService = module.get(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
  });

  it('lists users for the admin dashboard', async () => {
    usersRepository.find.mockResolvedValue([
      {
        id: 'user-1',
        email: 'traveler@example.com',
        role: UserRole.USER,
        isActive: true,
        createdAt: new Date('2026-04-03T07:00:00.000Z'),
        updatedAt: new Date('2026-04-03T08:00:00.000Z'),
      },
    ]);

    const response = await usersService.getAdminUsers();

    expect(response).toEqual([
      {
        id: 'user-1',
        email: 'traveler@example.com',
        role: UserRole.USER,
        isActive: true,
        createdAt: '2026-04-03T07:00:00.000Z',
        updatedAt: '2026-04-03T08:00:00.000Z',
      },
    ]);
  });

  it('updates another user role and active status', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'user-2',
      email: 'traveler@example.com',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date('2026-04-03T07:00:00.000Z'),
      updatedAt: new Date('2026-04-03T08:00:00.000Z'),
    });
    usersRepository.save.mockImplementation(async (value) => ({
      ...value,
      updatedAt: new Date('2026-04-03T09:00:00.000Z'),
    }));

    const response = await usersService.updateAdminUser('user-2', adminUser, {
      role: UserRole.ADMIN,
      isActive: false,
    });

    expect(response.role).toBe(UserRole.ADMIN);
    expect(response.isActive).toBe(false);
  });

  it('blocks admins from removing their own dashboard access', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date('2026-04-03T07:00:00.000Z'),
      updatedAt: new Date('2026-04-03T08:00:00.000Z'),
    });

    await expect(
      usersService.updateAdminUser('admin-1', adminUser, {
        role: UserRole.USER,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks removing the last active admin', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'admin-2',
      email: 'second-admin@example.com',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date('2026-04-03T07:00:00.000Z'),
      updatedAt: new Date('2026-04-03T08:00:00.000Z'),
    });
    usersRepository.count.mockResolvedValue(1);

    await expect(
      usersService.updateAdminUser('admin-2', adminUser, {
        isActive: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws 404 when an admin user record is missing', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(usersService.getAdminUserById('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
