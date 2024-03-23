import { Module } from '@nestjs/common';
import { RanksService } from './ranks.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from 'src/app.service';
import { UserRepositoryModule } from '../user-repository/user-repository.module';
import { FriendsModule } from '../friends/friends.module';
import { GameModule } from '../game/game.module';

@Module({
	imports: [
		ScheduleModule.forRoot(),
		UserRepositoryModule,
		FriendsModule,
		GameModule,
	],
	controllers: [UsersController],
	providers: [AppService, RanksService, UsersService],
})
export class UsersModule {}
