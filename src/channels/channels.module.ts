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

@Module({
	imports: [TypeOrmModule.forFeature([Channel, ChannelUser, User])],
	controllers: [ChannelsController],
	providers: [
		ChannelsService,
		ChannelsRepository,
		ChannelUsersRepository,
		UsersRepository,
	],
})
export class ChannelsModule {}
