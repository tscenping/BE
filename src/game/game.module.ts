import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { GameController } from './game.controller';
import { GameRepository } from './game.repository';
import { GameService } from './game.service';
import { UsersRepository } from '../users/users.repository';
import { User } from '../users/entities/user.entity';
import { GameInvitationRepository } from './game-invitation.repository';
import { GameInvitation } from './entities/game-invitation.entity';
import { GameGateway } from './game.gateway';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ChannelUsersRepository } from '../channels/channel-users.repository';
import { FriendsRepository } from '../users/friends.repository';
import { ChannelUser } from '../channels/entities/channel-user.entity';
import { Friend } from '../users/entities/friend.entity';
import { ChannelsModule } from '../channels/channels.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Game,
			GameInvitation,
			User,
			ChannelUser,
			Friend,
		]),
		ChannelsModule,
	],
	controllers: [GameController],
	providers: [
		GameGateway,
		GameService,
		AuthService,
		JwtService,
		ChannelUsersRepository,
		FriendsRepository,
		GameRepository,
		GameInvitationRepository,
		UsersRepository,
	],
})
export class GameModule {}
