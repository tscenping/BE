import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from 'src/game/entities/game.entity';
import { GameRepository } from 'src/game/game.repository';
import { BlocksRepository } from 'src/users/blocks.repository';
import { Block } from 'src/users/entities/block.entity';
import { Friend } from 'src/users/entities/friend.entity';
import { User } from 'src/users/entities/user.entity';
import { FriendsRepository } from 'src/users/friends.repository';
import { UsersRepository } from 'src/users/users.repository';
import { UsersService } from 'src/users/users.service';
import { ChannelInvitationRepository } from './channel-invitation.repository';
import { ChannelUsersRepository } from './channel-users.repository';
import { ChannelsController } from './channels.controller';
import { ChannelsGateway } from './channels.gateway';
import { ChannelsRepository } from './channels.repository';
import { ChannelsService } from './channels.service';
import { ChannelInvitation } from './entities/channel-invitation.entity';
import { ChannelUser } from './entities/channel-user.entity';
import { Channel } from './entities/channel.entity';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Channel,
			ChannelUser,
			ChannelInvitation,
			User,
			Game,
			Friend,
			Block,
		]),
	],
	controllers: [ChannelsController],
	providers: [
		ChannelsService,
		UsersService,
		AuthService,
		JwtService,
		ChannelsRepository,
		ChannelUsersRepository,
		ChannelInvitationRepository,
		UsersRepository,
		ChannelsGateway,
		GameRepository,
		FriendsRepository,
		BlocksRepository,
	],
})
export class ChannelsModule {}
