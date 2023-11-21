import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelsRepository } from './channels.repository';
import { ChannelUsersRepository } from './channel-users.repository';
import { ChannelUser } from './entities/channel-user.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Channel, ChannelUser])],
	controllers: [ChannelsController],
	providers: [ChannelsService, ChannelsRepository, ChannelUsersRepository],
})
export class ChannelsModule {}
