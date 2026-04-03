import { registerAs } from '@nestjs/config';

export default registerAs('admin', () => ({
  seedEmail: process.env.ADMIN_EMAIL ?? '',
  seedPassword: process.env.ADMIN_PASSWORD ?? '',
}));
