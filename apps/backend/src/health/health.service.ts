import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      service: this.configService.get<string>('app.name', 'TripBazarBD Backend'),
      environment: this.configService.get<string>('app.nodeEnv', 'development'),
      timestamp: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(2)),
    };
  }
}
