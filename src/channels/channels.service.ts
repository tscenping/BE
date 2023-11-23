import { Length } from 'class-validator';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ChannelType, ChannelUserType } from 'src/common/enum';
import { ChannelUsersRepository } from './channel-users.repository';
import { ChannelsRepository } from './channels.repository';
import { CreateChannelRequestDto } from './dto/create-channel-request.dto';
import { UsersRepository } from 'src/users/users.repository';

@Injectable()
export class ChannelsService {
	constructor(
		private readonly channelsRepository: ChannelsRepository,
		private readonly channelUsersRepository: ChannelUsersRepository,
		private readonly usersRepository: UsersRepository,
	) {}

	private readonly logger = new Logger(ChannelsService.name);

	async createChannel(userId: number, channelInfo: CreateChannelRequestDto) {
		// DM 채널인 경우 예외 처리
		if (channelInfo.channelType === ChannelType.DM) {
			await this.validateDmChannel(userId, channelInfo.userId);
		}
		// 채널 생성 및 DB에 저장
		const channel = this.channelsRepository.create({
			...channelInfo,
			ownerId: userId,
		});

		await this.channelsRepository.save(channel);

		// channelUsers 생성 및 DB에 저장
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

	async enterChannel(userId: number, channelId: number) {
		// 채널이 존재하는지 확인
		const channel = await this.channelsRepository.findOneBy({
			id: channelId,
		});
		if (!channel) {
			throw new BadRequestException(
				`channel ${channelId} does not exist`,
			);
		}

		// 이미 참여 중인 채널인지 확인
		const myChannelUserInfo = await this.channelUsersRepository.findOneBy({
			channelId,
			userId,
		});
		if (!myChannelUserInfo) {
			throw new BadRequestException(
				`user ${userId} is not in channel ${channelId}`,
			);
		}

		// 채널 유저 정보 조회
		const channelUserInfoList =
			await this.channelUsersRepository.findChannelUserInfoList(
				userId,
				channelId,
			);

		return {
			channelUsers: channelUserInfoList,
			myChannelUserType: myChannelUserInfo.channelUserType,
		};
	}

	async validateDmChannel(userId: number, targetUserId: number) {
		// 자기 자신에게 DM 채널을 생성할 수 없음
		if (userId === targetUserId) {
			throw new BadRequestException(`cannot create DM channel to myself`);
		}

		// target user가 존재하는지 확인
		const targetUser = await this.usersRepository.findOneBy({
			id: targetUserId,
		});
		if (!targetUser) {
			throw new BadRequestException(
				`user ${targetUserId} does not exist`,
			);
		}

		// 이미 DM 채널이 존재하는지 확인
		const dmChannel = await this.channelsRepository.findDmChannelUser(
			userId,
			targetUserId,
		);

		if (dmChannel && dmChannel.length > 0) {
			throw new BadRequestException(
				`DM channel already exists between ${userId} and ${targetUserId}`,
			);
		}
	}
}
