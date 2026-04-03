import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  path:
    process.env.DATABASE_PATH ??
    (process.env.NODE_ENV === 'test' ? ':memory:' : 'tripbazarbd.sqlite'),
}));
