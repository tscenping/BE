import { Controller, Get, Param } from '@nestjs/common';
import { RedisService } from './redis.service';
@Controller('ranking')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get()
  async getTwenty() {
    return this.redisService.getTwenty();
  }

  @Get(':id')
  async findOneById(@Param('id') id: string) {
    return this.redisService.findOneById(+id);
  }
}
