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
import { GameInvitation } from '../game/entities/game-invitation.entity';
import { GameInvitationRepository } from '../game/game-invitation.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, Friend, Block, Game, GameInvitation]),
		ScheduleModule.forRoot(),
	],
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
		GameInvitationRepository,
		AppService,
	],
	exports: [UsersService],
})
export class UsersModule {}
