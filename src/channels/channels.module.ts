import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UsersRepository } from 'src/users/users.repository';
import { ChannelInvitationRepository } from './channel-invitation.repository';
import { ChannelUsersRepository } from './channel-users.repository';
import { ChannelsController } from './channels.controller';
import { ChannelsRepository } from './channels.repository';
import { ChannelsService } from './channels.service';
import { ChannelInvitation } from './entities/channel-invitation.entity';
import { ChannelUser } from './entities/channel-user.entity';
import { Channel } from './entities/channel.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Channel,
			ChannelUser,
			ChannelInvitation,
			User,
		]),
	],
	controllers: [ChannelsController],
	providers: [
		ChannelsService,
		ChannelsRepository,
		ChannelUsersRepository,
		ChannelInvitationRepository,
		UsersRepository,
	],
})
export class ChannelsModule {}
