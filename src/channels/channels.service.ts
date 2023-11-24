import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ChannelType, ChannelUserType } from 'src/common/enum';
import { ChannelUsersRepository } from './channel-users.repository';
import { ChannelsRepository } from './channels.repository';
import { CreateChannelRequestDto } from './dto/create-channel-request.dto';
import { UsersRepository } from 'src/users/users.repository';
import { CreatChannelUserParamDto } from './dto/creat-channel-user-param.dto';
import * as bycrypt from 'bcrypt';
import { CreateInvitationParamDto } from './dto/create-invitation-param.dto';
import { ChannelInvitationRepository } from './channel-invitation.repository';
import { ChannelUsersResponseDto } from './dto/channel-users-response.dto';

@Injectable()
export class ChannelsService {
	constructor(
		private readonly channelsRepository: ChannelsRepository,
		private readonly channelUsersRepository: ChannelUsersRepository,
		private readonly channelInvitationRepository: ChannelInvitationRepository,
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

	async createChannelUser(
		channelUserParamDto: CreatChannelUserParamDto,
	): Promise<ChannelUsersResponseDto> {
		const channelId = channelUserParamDto.channelId;
		const userId = channelUserParamDto.userId;
		const password = channelUserParamDto.password;

		// 존재하는 channel인지 확인
		const channel = await this.channelsRepository.findOne({
			where: { id: channelId },
		});
		if (!channel)
			throw new BadRequestException(
				`channel ${channelId} does not exist`,
			);

		// user가 channel에 없는지 확인
		const channelUser = await this.channelUsersRepository.findOne({
			where: { channelId: channelId, userId: userId },
		});
		if (channelUser)
			throw new BadRequestException(
				`user already in this channel ${channelId}`,
			);

		// channel이 프로텍티드라면 비밀번호가 맞는지 확인
		if (channel.channelType === ChannelType.PROTECTED) {
			if (!password)
				throw new BadRequestException(
					'this is protected channel. enter password',
				);

			const channelPassword = channel.password as string;
			if (await bycrypt.compare(password, channelPassword)) {
				throw new BadRequestException(
					'user cannot join this protected channel. check password',
				);
			}
		}
		// channel이 프라이빗이라면 초대 받은적이 있는지 확인
		if (channel.channelType === ChannelType.PRIVATE) {
			const channelInvitation =
				await this.channelInvitationRepository.findOne({
					where: {
						channelId: channelId,
						invitingUserId: userId,
					},
				});

			if (!channelInvitation) {
				throw new BadRequestException(
					'user cannot join this private channel. not invited',
				);
			}
		}

		await this.channelUsersRepository.createChannelUser(channelId, userId);

		const channelUsers =
			await this.channelUsersRepository.findChannelUserInfoList(
				userId,
				channelId,
			);

		return { channelUsers, myChannelUserType: ChannelUserType.MEMBER };
	}

	async createChannelInvitation(
		createInvitationParamDto: CreateInvitationParamDto,
	) {
		const invitingUserId = createInvitationParamDto.invitingUserId;
		const invitedUserId = createInvitationParamDto.invitedUserId;

		if (invitingUserId === invitedUserId)
			throw new BadRequestException('cannot invite yourself');

		// 초대받은 user가 존재하는지 확인
		const user = this.usersRepository.findOne({
			where: { id: invitedUserId },
		});
		if (!user)
			throw new BadRequestException(
				`user ${invitedUserId} doesn't exist`,
			);

		const channelId = createInvitationParamDto.channelId;

		// 초대한 user가 channel에 있는지 확인
		const invitingChannelUser = await this.channelUsersRepository.findOne({
			where: { userId: invitingUserId, channelId: channelId },
		});
		if (!invitingChannelUser)
			throw new BadRequestException(
				`inviting user ${invitingUserId} not in this channel ${channelId}`,
			);

		// 초대받은 user가 channel에 없는지 확인
		const invitedChannelUser = await this.channelUsersRepository.findOne({
			where: { userId: invitedUserId, channelId: channelId },
		});
		if (invitedChannelUser)
			throw new BadRequestException(
				`invited user ${invitedUserId} already in this channel ${channelId}`,
			);

		await this.channelInvitationRepository.createChannelInvitation(
			new CreateInvitationParamDto(
				invitingUserId,
				channelId,
				invitedUserId,
			),
		);
	}

	async updateChannel(userId: number, channelId: number) {
		// 존재하는 channel인지 확인
		const channel = await this.channelsRepository.findOne({
			where: { id: channelId },
		});

		if (!channel)
			throw new BadRequestException(
				`channel ${channelId} does not exist`,
			);

		// user가 channel에 있는지 확인
		const channelUser = await this.channelUsersRepository.findOne({
			where: { userId, channelId },
		});
		if (!channelUser)
			throw new BadRequestException(
				`user does not in this channel ${channelId}`,
			);
		// channel의 owner였으면 channel 인포에서 ownerId null로 만들기
		if (userId === channel.ownerId)
			await this.channelsRepository.updateOwnerId(channelId);

		// channel에서 user 지우기
		await this.channelUsersRepository.softDeleteUserFromChannel(
			channelUser.id,
		);

		// dm이거나 마지막 사람이라면 => channel까지 삭제
		const cnt = await this.channelUsersRepository.countChannelById(
			channelId,
		);

		if (channel.channelType === ChannelType.DM || cnt === 0) {
			await this.channelsRepository.softDeleteChannel(channel.id);
		}
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
