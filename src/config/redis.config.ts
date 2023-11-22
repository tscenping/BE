import {
  RedisModuleOptions
} from '@liaoliaots/nestjs-redis';
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export default registerAs('redis', () => {
  const REDIS_HOST = z.string().parse(process.env.HOSTNAME);
  const REDIS_PORT = parseInt(z.string().parse(process.env.REDIS_PORT), 10);
  const REDIS_PASSWORD = z.string().parse(process.env.REDIS_PASSWORD);
  const REDIS_URL = z.string().parse(process.env.REDIS_URL);

  return {
    config: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    url: process.env.REDIS_URL,
    password: REDIS_PASSWORD,}
  } satisfies RedisModuleOptions;
});

// @Injectable()
// export class RedisConfigService implements RedisOptionsFactory {
//   constructor(private configService: ConfigService) {}

//   async createRedisOptions(): Promise<RedisModuleOptions> {
//     return {
//       config: {
//         host: this.configService.get<string>('REDIS_HOSTNAME'),
//         port: this.configService.get<number>('REDIS_PORT'),
//         password: this.configService.get<string>('REDIS_PASSWORD'),
//       },
//     };
//   }
// }