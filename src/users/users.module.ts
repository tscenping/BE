import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from 'src/game/entities/game.entity';
import { GameRepository } from 'src/game/game.repository';
import { BlocksRepository } from './blocks.repository';
import { BlocksService } from './blocks.service';
import { Block } from './entities/block.entity';
import { Friend } from './entities/friend.entity';
import { User } from './entities/user.entity';
import { FriendsRepository } from './friends.repository';
import { FriendsService } from './friends.service';
import { RanksService } from './ranks.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
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
