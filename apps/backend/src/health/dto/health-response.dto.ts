import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 'TripBazarBD Backend' })
  service: string;

  @ApiProperty({ example: 'development' })
  environment: string;

  @ApiProperty({ example: '2026-04-03T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 42.18 })
  uptimeSeconds: number;
}
