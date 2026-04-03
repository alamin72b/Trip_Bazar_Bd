import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getAppInfo() {
    const apiPrefix = this.configService.get<string>('app.apiPrefix', 'api/v1');

    return {
      name: this.configService.get<string>('app.name', 'TripBazarBD Backend'),
      version: this.configService.get<string>('app.version', '1.0.0'),
      message: 'TripBazarBD backend foundation is running.',
      docsPath: '/docs',
      healthPath: `/${apiPrefix}/health`,
    };
  }
}
