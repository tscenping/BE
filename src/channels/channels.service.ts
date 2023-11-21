import { Injectable, Logger } from '@nestjs/common';
import { ChannelType, ChannelUserType } from 'src/common/enum';
import { ChannelUsersRepository } from './channel-users.repository';
import { ChannelsRepository } from './channels.repository';
import { CreateChannelRequestDto } from './dto/create-channel-request.dto';

@Injectable()
export class ChannelsService {
	constructor(
		private readonly channelsRepository: ChannelsRepository,
		private readonly channelUsersRepository: ChannelUsersRepository,
	) {}

	private readonly logger = new Logger(ChannelsService.name);

	async createChannel(userId: number, channelInfo: CreateChannelRequestDto) {
		const channel = this.channelsRepository.create({
			...channelInfo,
			ownerId: userId,
		});

		const result = await this.channelsRepository.save(channel);

		// channelUsers DB에 저장
		const channelUser = this.channelUsersRepository.create({
			channelId: channel.id,
			userId,
			channelUserType: ChannelUserType.OWNER,
		});

		await this.channelUsersRepository.save(channelUser);

		let userCount = 1;

		if (channel.channelType === ChannelType.DM) {
			const targetChannelUser = this.channelUsersRepository.create({
				channelId: channel.id,
				userId: channelInfo.userId!,
				channelUserType: ChannelUserType.MEMBER,
			});

			await this.channelUsersRepository.save(targetChannelUser);

			++userCount;
		}

		// TODO: 채널에 소환된 유저에게 알림 전송. DM의 경우에만 해당
		// TODO: cache에 user count 저장
		this.logger.log(
			`channel ${channel.id} is created. user count: ${userCount}`,
		);

		return { channelId: channel.id };
	}
}
