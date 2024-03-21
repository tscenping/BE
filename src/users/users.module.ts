import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from 'src/game/entities/game.entity';
import { GameRepository } from 'src/game/game.repository';
import { BlocksRepository } from '../friends/blocks.repository';
import { BlocksService } from '../friends/blocks.service';
import { Block } from '../friends/entities/block.entity';
import { Friend } from '../friends/entities/friend.entity';
import { User } from '../user-repository/entities/user.entity';
import { FriendsRepository } from '../friends/friends.repository';
import { FriendsService } from '../friends/friends.service';
import { RanksService } from './ranks.service';
import { UsersController } from './users.controller';
import { UsersRepository } from '../user-repository/users.repository';
import { UsersService } from './users.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from 'src/app.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, Friend, Block, Game]),
		ScheduleModule.forRoot(),
	],
	controllers: [UsersController],
	providers: [
		AppService,
		RanksService,
		UsersService,
		FriendsService,
		BlocksService,
		UsersRepository,
		FriendsRepository,
		BlocksRepository,
		GameRepository,
	],
	exports: [
		UsersService,
		UsersRepository,
		FriendsRepository,
		BlocksRepository,
	],
})
export class UsersModule {}
