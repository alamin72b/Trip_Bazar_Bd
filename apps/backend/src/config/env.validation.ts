import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

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
}

export function validateEnv(config: Record<string, unknown>) {
  const mergedConfig = {
    NODE_ENV: 'development',
    PORT: 3000,
    API_PREFIX: 'api/v1',
    APP_NAME: 'TripBazarBD Backend',
    APP_DESCRIPTION: 'Backend API for the TripBazarBD travel-offer platform.',
    APP_VERSION: '1.0.0',
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

  return mergedConfig;
}
