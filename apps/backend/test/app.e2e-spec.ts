import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './../src/app.controller';
import { AppModule } from './../src/app.module';
import { HealthController } from './../src/health/health.controller';

describe('AppController (integration)', () => {
  let app: INestApplication;
  let appController: AppController;
  let healthController: HealthController;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    appController = app.get(AppController);
    healthController = app.get(HealthController);
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns the app metadata', () => {
    expect(appController.getAppInfo()).toEqual(
      expect.objectContaining({
        message: 'TripBazarBD backend foundation is running.',
        docsPath: '/docs',
        healthPath: '/api/v1/health',
      }),
    );
  });

  it('returns the health response', () => {
    expect(healthController.getHealth()).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'TripBazarBD Backend',
      }),
    );
  });
});
