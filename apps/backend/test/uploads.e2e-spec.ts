import {
  ExecutionContext,
  ForbiddenException,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Request } from 'express';
import { AppModule } from '../src/app.module';
import { AdminUploadsController } from '../src/admin/admin-uploads.controller';
import { AuthController } from '../src/auth/auth.controller';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { UserRole } from '../src/users/enums/user-role.enum';

describe('AdminUploadsController (integration)', () => {
  let app: INestApplication;
  let authController: AuthController;
  let adminUploadsController: AdminUploadsController;
  let rolesGuard: RolesGuard;
  let uploadRootDir: string;

  beforeEach(async () => {
    uploadRootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'tripbazarbd-upload-spec-'),
    );

    process.env.NODE_ENV = 'test';
    process.env.DATABASE_PATH = ':memory:';
    process.env.UPLOAD_ROOT_DIR = uploadRootDir;
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'admin-password-123';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authController = app.get(AuthController);
    adminUploadsController = app.get(AdminUploadsController);
    rolesGuard = app.get(RolesGuard);
  });

  afterEach(async () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    delete process.env.UPLOAD_ROOT_DIR;
    await app.close();
    fs.rmSync(uploadRootDir, { recursive: true, force: true });
  });

  function createAdminExecutionContext(role: UserRole): ExecutionContext {
    const handler = Object.getOwnPropertyDescriptor(
      AdminUploadsController.prototype,
      'uploadOfferImages',
    )?.value as () => unknown;

    return {
      getClass: () => AdminUploadsController,
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

  function createRequest(): Request {
    return {
      protocol: 'http',
      header: () => undefined,
      get: (name: string) => (name === 'host' ? 'localhost:3000' : undefined),
    } as Request;
  }

  it('admin can upload multiple offer images', async () => {
    const authResponse = await authController.authenticateWithEmail({
      email: 'admin@example.com',
      password: 'admin-password-123',
    });

    expect(
      rolesGuard.canActivate(createAdminExecutionContext(authResponse.user.role)),
    ).toBe(true);

    const response = await adminUploadsController.uploadOfferImages(
      [
        {
          buffer: Buffer.from('fake-jpeg-image'),
          mimetype: 'image/jpeg',
          originalname: 'beach.jpg',
        },
        {
          buffer: Buffer.from('fake-png-image'),
          mimetype: 'image/png',
          originalname: 'hill.png',
        },
      ],
      createRequest(),
    );

    expect(response).toHaveLength(2);
    expect(response[0]?.url).toContain('/uploads/offers/');

    const uploadedFilePath = path.join(
      uploadRootDir,
      'offers',
      response[0]?.filename as string,
    );

    expect(fs.existsSync(uploadedFilePath)).toBe(true);
  });

  it('rejects unsupported image types', async () => {
    await expect(
      adminUploadsController.uploadOfferImages(
        [
          {
            buffer: Buffer.from('plain-text'),
            mimetype: 'text/plain',
            originalname: 'notes.txt',
          },
        ],
        createRequest(),
      ),
    ).rejects.toThrow('Only JPG, PNG, and WebP images are supported.');
  });

  it('rejects upload access for non-admin users', async () => {
    expect(() =>
      rolesGuard.canActivate(createAdminExecutionContext(UserRole.USER)),
    ).toThrow(ForbiddenException);
  });
});
