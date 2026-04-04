import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fs from 'node:fs';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { resolveUploadRootDir } from './config/upload-root-dir.util';

export function configureApp(app: NestExpressApplication): void {
  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  const appName = configService.get<string>('app.name', 'TripBazarBD Backend');
  const appDescription = configService.get<string>(
    'app.description',
    'Backend API for the TripBazarBD travel-offer platform.',
  );
  const appVersion = configService.get<string>('app.version', '1.0.0');
  const uploadRootDir = resolveUploadRootDir(
    configService.get<string>('app.uploadRootDir'),
    configService.get<string>('app.nodeEnv'),
  );

  fs.mkdirSync(uploadRootDir, { recursive: true });

  app.enableCors();
  app.useStaticAssets(uploadRootDir, {
    prefix: '/uploads/',
  });
  app.setGlobalPrefix(apiPrefix, {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(appDescription)
    .setVersion(appVersion)
    .addServer(`/${apiPrefix}`)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
}
