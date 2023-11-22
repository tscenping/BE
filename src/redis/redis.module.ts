import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';

@Module({
  controllers: [RedisController],
  providers: [RedisService]
})
export class RedisModule {}
