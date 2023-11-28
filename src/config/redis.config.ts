import {
  RedisModuleOptions
} from '@liaoliaots/nestjs-redis';
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export default registerAs('redis', () => {
  const REDIS_HOST = z.string().parse(process.env.REDIS_HOSTNAME);
  const REDIS_PORT = parseInt(z.string().parse(process.env.REDIS_PORT), 10);
  const REDIS_URL = z.string().parse(process.env.REDIS_URL);

  return {
    config: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    url: REDIS_URL, }
  } satisfies RedisModuleOptions;
});
