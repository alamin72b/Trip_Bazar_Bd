import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsEnum(['development', 'test', 'production'])
  NODE_ENV?: 'development' | 'test' | 'production';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsString()
  API_PREFIX?: string;

  @IsOptional()
  @IsString()
  APP_NAME?: string;

  @IsOptional()
  @IsString()
  APP_DESCRIPTION?: string;

  @IsOptional()
  @IsString()
  APP_VERSION?: string;

  @IsOptional()
  @IsString()
  UPLOAD_ROOT_DIR?: string;

  @IsOptional()
  @IsString()
  DATABASE_PATH?: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_TOKEN_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_TOKEN_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_TOKEN_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_TOKEN_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const mergedConfig = {
    NODE_ENV: 'development',
    PORT: 3000,
    API_PREFIX: 'api/v1',
    APP_NAME: 'TripBazarBD Backend',
    APP_DESCRIPTION: 'Backend API for the TripBazarBD travel-offer platform.',
    APP_VERSION: '1.0.0',
    UPLOAD_ROOT_DIR: '',
    DATABASE_PATH:
      config.NODE_ENV === 'test' ? ':memory:' : 'tripbazarbd.sqlite',
    JWT_ACCESS_TOKEN_SECRET: 'tripbazarbd-dev-access-secret',
    JWT_ACCESS_TOKEN_EXPIRES_IN: '15m',
    JWT_REFRESH_TOKEN_SECRET: 'tripbazarbd-dev-refresh-secret',
    JWT_REFRESH_TOKEN_EXPIRES_IN: '7d',
    ADMIN_EMAIL: '',
    ADMIN_PASSWORD: '',
    ...config,
  };

  const validatedConfig = plainToInstance(EnvironmentVariables, mergedConfig, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  if (
    validatedConfig.NODE_ENV === 'production' &&
    (!config.JWT_ACCESS_TOKEN_SECRET || !config.JWT_REFRESH_TOKEN_SECRET)
  ) {
    throw new Error(
      'JWT_ACCESS_TOKEN_SECRET and JWT_REFRESH_TOKEN_SECRET are required in production.',
    );
  }

  return mergedConfig;
}
