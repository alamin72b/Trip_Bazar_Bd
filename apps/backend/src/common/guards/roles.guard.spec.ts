import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/enums/user-role.enum';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    rolesGuard = new RolesGuard(reflector);
  });

  function createExecutionContext(role?: UserRole): ExecutionContext {
    return {
      getClass: jest.fn(),
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role
            ? {
                sub: 'user-id',
                email: 'user@example.com',
                role,
              }
            : undefined,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows admin users when admin role is required', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(rolesGuard.canActivate(createExecutionContext(UserRole.ADMIN))).toBe(
      true,
    );
  });

  it('rejects normal users when admin role is required', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() =>
      rolesGuard.canActivate(createExecutionContext(UserRole.USER)),
    ).toThrow(ForbiddenException);
  });
});
