import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  accessTokenSecret:
    process.env.JWT_ACCESS_TOKEN_SECRET ?? 'tripbazarbd-dev-access-secret',
  accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '15m',
  refreshTokenSecret:
    process.env.JWT_REFRESH_TOKEN_SECRET ?? 'tripbazarbd-dev-refresh-secret',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ?? '7d',
}));
