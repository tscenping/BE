import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friend } from './entities/friend.entity';
import { User } from './entities/user.entity';
import { FriendsRepository } from './friends.repository';
import { FriendsService } from './friends.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { Block } from './entities/block.entity';
import { BlocksService } from './blocks.service';
import { BlocksRepository } from './blocks.repository';
import { GameRepository } from 'src/game/game.repository';
import { Game } from 'src/game/entities/game.entity';
import { RanksService } from './ranks.service';
import { RedisRepository } from 'src/redis/redis.repository';

@Module({
	imports: [TypeOrmModule.forFeature([User, Friend, Block, Game])],
	controllers: [UsersController],
	providers: [
		UsersService,
		FriendsService,
		BlocksService,
		RanksService,
		UsersRepository,
		FriendsRepository,
		BlocksRepository,
		GameRepository,
		RedisRepository,
	],
	exports: [UsersService],
})
export class UsersModule {}
