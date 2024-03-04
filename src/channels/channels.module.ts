import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelInvitationRepository } from './channel-invitation.repository';
import { ChannelUsersRepository } from './channel-users.repository';
import { ChannelsController } from './channels.controller';
import { ChannelsGateway } from './channels.gateway';
import { ChannelsRepository } from './channels.repository';
import { ChannelsService } from './channels.service';
import { ChannelInvitation } from './entities/channel-invitation.entity';
import { ChannelUser } from './entities/channel-user.entity';
import { Channel } from './entities/channel.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Channel, ChannelUser, ChannelInvitation]),
		AuthModule,
		UsersModule,
	],
	controllers: [ChannelsController],
	providers: [
		ChannelsGateway,
		ChannelsService,
		ChannelsRepository,
		ChannelUsersRepository,
		ChannelInvitationRepository,
	],
	exports: [ChannelsGateway, ChannelUsersRepository],
})
export class ChannelsModule {}
