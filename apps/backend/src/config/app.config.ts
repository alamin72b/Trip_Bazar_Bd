import { registerAs } from '@nestjs/config';
import path from 'node:path';
import os from 'node:os';

export default registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'TripBazarBD Backend',
  description:
    process.env.APP_DESCRIPTION ??
    'Backend API for the TripBazarBD travel-offer platform.',
  version: process.env.APP_VERSION ?? '1.0.0',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  uploadRootDir:
    process.env.UPLOAD_ROOT_DIR ??
    (process.env.NODE_ENV === 'test'
      ? path.join(os.tmpdir(), 'tripbazarbd-test-uploads')
      : path.join(process.cwd(), 'uploads')),
}));
