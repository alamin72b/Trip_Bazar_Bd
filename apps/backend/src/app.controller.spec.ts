import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const values: Record<string, string> = {
                'app.apiPrefix': 'api/v1',
                'app.name': 'TripBazarBD Backend',
                'app.version': '1.0.0',
              };

              return values[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getAppInfo', () => {
    it('should return the app metadata', () => {
      expect(appController.getAppInfo()).toEqual(
        expect.objectContaining({
          message: 'TripBazarBD backend foundation is running.',
          docsPath: '/docs',
        }),
      );
    });
  });
});
