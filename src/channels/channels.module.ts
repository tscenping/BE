import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelsRepository } from './channels.repository';
import { ChannelUsersRepository } from './channel-users.repository';
import { ChannelUser } from './entities/channel-user.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersRepository } from 'src/users/users.repository';
import { ChannelInvitationRepository } from './channel-invitation.repository';
import { ChannelInvitation } from './entities/channel-invitation.entity';
import { RedisRepository } from 'src/redis/redis.repository';

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
		RedisRepository,
	],
})
export class ChannelsModule {}
