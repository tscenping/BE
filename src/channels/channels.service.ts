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
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { UpdateChannelPwdParamDto } from './dto/update-channel-pwd-param.dto';

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
		// TODO: isBanned 확인하기

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

	async updateChannelTypeAndPassword(
		updateChannelPwdParamDto: UpdateChannelPwdParamDto,
	) {
		// channel 유효성 확인
		const channelId = updateChannelPwdParamDto.channelId;
		const channel = await this.checkChannelExist(channelId);

		// 요청한 user의 유효성 확인 (채널에 있는지, owner인지)
		const userId = updateChannelPwdParamDto.userId;
		const channelUser = await this.checkUserExistInChannel(
			userId,
			channelId,
		);

		if (channelUser.channelUserType !== ChannelUserType.OWNER)
			throw new BadRequestException(
				`user ${userId} does not have authority`,
			);

		const password = updateChannelPwdParamDto.password;
		if (!password) {
			// input password가 null일 때
			if (channel.channelType === ChannelType.PROTECTED) {
				await this.updateChannelType(channelId, ChannelType.PUBLIC);
			}
		} else {
			if (channel.channelType === ChannelType.PUBLIC) {
				await this.updateChannelType(channelId, ChannelType.PROTECTED);
			}
			const channelPassword = channel.password as string;
			if (!(await bycrypt.compare(password, channelPassword))) {
				await this.updateChannelPassword(channelId, password);
			}
			// 수정 전이랑 후 같은거 무시 및 처리는 프롱트에서 하자
		}
	}

	async createChannelUser(
		channelUserParamDto: CreatChannelUserParamDto,
	): Promise<ChannelUsersResponseDto> {
		const channelId = channelUserParamDto.channelId;
		const userId = channelUserParamDto.userId;
		const password = channelUserParamDto.password;

		// 존재하는 channel인지 확인
		const channel = await this.checkChannelExist(channelId);

		// user가 channel에 없는지 확인
		await this.checkUserExistInChannel(userId, channelId);

		// channel이 프로텍티드라면 비밀번호가 맞는지 확인
		if (channel.channelType === ChannelType.PROTECTED) {
			if (!password)
				throw new BadRequestException(
					'this is protected channel. enter password',
				);

			const channelPassword = channel.password as string;
			if (!(await bycrypt.compare(password, channelPassword))) {
				throw new BadRequestException(
					'user cannot join this protected channel. check password',
				);
			}
		}
		// channel이 프라이빗이라면 초대 받은적이 있는지 확인
		else if (channel.channelType === ChannelType.PRIVATE) {
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
		const channelId = createInvitationParamDto.channelId;
		const invitedUserId = createInvitationParamDto.invitedUserId;

		// 존재하는 channel인지 확인
		await this.checkChannelExist(channelId);

		if (invitingUserId === invitedUserId)
			throw new BadRequestException('cannot invite yourself');

		// 초대받은 user가 존재하는지 확인
		await this.checkUserExist(invitedUserId);

		// 초대한 user가 channel에 있는지 확인
		await this.checkUserExistInChannel(invitingUserId, channelId);

		// 초대받은 user가 channel에 없는지 확인
		await this.checkUserExistInChannel(invitedUserId, channelId);

		await this.channelInvitationRepository.createChannelInvitation(
			createInvitationParamDto,
		);

		// TODO: 알람 보내기
	}

	async updateChannelUser(userId: number, channelId: number) {
		// 존재하는 channel인지 확인
		const channel = await this.checkChannelExist(channelId);

		// user가 channel에 있는지 확인
		const channelUser = await this.checkUserExistInChannel(
			userId,
			channelId,
		);

		// channel의 owner였으면 channel 인포에서 ownerId null로 만들기
		if (userId === channel.ownerId)
			await this.channelsRepository.update(channelId, {
				ownerId: null,
			});

		// channel에서 user 지우기
		await this.channelUsersRepository.softDeleteUserFromChannel(
			channelUser.id,
		);

		// dm이거나 마지막 사람이라면 => channel까지 삭제
		const cnt = await this.channelUsersRepository.count({
			where: {
				channelId: channelId,
			},
		});

		if (channel.channelType === ChannelType.DM || cnt === 0) {
			await this.channelsRepository.softDeleteChannel(channel.id);
		}
	}

	/**
	 * 관리자 임명
	 * @param giverUserId 권한을 주는
	 * @param receiverChannelUserId 권한을 받는
	 */
	async updateChannelUserType(
		giverUserId: number,
		receiverChannelUserId: number,
	) {
		// 유효한 channelUserId인지 확인
		const receiverChannelUser = await this.checkChannelUserExist(
			receiverChannelUserId,
		);

		// channel 유효성 확인
		const channelId = receiverChannelUser.channelId;
		await this.checkChannelExist(channelId);

		// giver user 유효성 확인 (channel에 속한 user인지, owner인지)
		const giverChannelUser = await this.checkUserExistInChannel(
			giverUserId,
			channelId,
		);
		if (giverChannelUser.channelUserType !== ChannelUserType.OWNER)
			throw new BadRequestException(
				`giver ${giverUserId} does not have authority`,
			);

		// receiver user 유효성 확인 (존재하는 user인지)
		const receiverUserId = receiverChannelUser.userId;
		await this.checkUserExist(receiverUserId);

		// 임명 / 해제 처리
		await this.channelUsersRepository.updateChannelUserType(
			receiverChannelUserId,
		);
	}

	async kickChannelUser(giverUserId: number, receiverChannelUserId: number) {
		// 유효한 channelUserId인지 확인
		const receiverChannelUser = await this.checkChannelUserExist(
			receiverChannelUserId,
		);

		// channel 유효성 확인
		const channelId = receiverChannelUser.channelId;
		await this.checkChannelExist(channelId);

		// giver user 유효성 확인 (channel에 속한 user인지, 권한 없는 member인지)
		const giverChannelUser = await this.checkUserExistInChannel(
			giverUserId,
			channelId,
		);

		if (giverChannelUser.channelUserType === ChannelUserType.MEMBER)
			throw new BadRequestException(
				`kicker ${giverUserId} does not have authority`,
			);

		// receiver user 유효성 확인 (존재하는 user인지)
		const receiverUserId = receiverChannelUser.userId;
		await this.checkUserExist(receiverUserId);

		// admin -> owner/admin 권한 행사 불가
		if (giverChannelUser.channelUserType === ChannelUserType.ADMIN) {
			if (
				receiverChannelUser.channelUserType === ChannelUserType.OWNER ||
				receiverChannelUser.channelUserType === ChannelUserType.ADMIN
			)
				throw new BadRequestException(
					`admin user ${giverUserId} cannot mute the owner/admin user ${receiverUserId}`,
				);
		}

		await this.channelUsersRepository.softDeleteUserFromChannel(
			receiverChannelUserId,
		);
	}

	async banChannelUser(giverUserId: number, receiverChannelUserId: number) {
		// 유효한 channelUserId인지 확인
		const receiverChannelUser = await this.checkChannelUserExist(
			receiverChannelUserId,
		);

		// channel 유효성 확인
		const channelId = receiverChannelUser.channelId;
		await this.checkChannelExist(channelId);

		// giver user 유효성 확인 (channel에 속한 user인지, 권한 없는 member인지)
		const giverChannelUser = await this.checkUserExistInChannel(
			giverUserId,
			channelId,
		);

		if (giverChannelUser.channelUserType === ChannelUserType.MEMBER)
			throw new BadRequestException(
				`kicker ${giverUserId} does not have authority`,
			);

		// receiver user 유효성 확인 (존재하는 user인지)
		const receiverUserId = receiverChannelUser.userId;
		await this.checkUserExist(receiverUserId);

		// admin -> owner/admin 권한 행사 불가
		if (giverChannelUser.channelUserType === ChannelUserType.ADMIN) {
			if (
				receiverChannelUser.channelUserType === ChannelUserType.OWNER ||
				receiverChannelUser.channelUserType === ChannelUserType.ADMIN
			)
				throw new BadRequestException(
					`admin user ${giverUserId} cannot mute the owner/admin user ${receiverUserId}`,
				);
		}

		const result = await this.channelUsersRepository.update(
			receiverChannelUserId,
			{
				isBanned: true,
			},
		);
		if (result.affected !== 1)
			throw DBUpdateFailureException('update isBanned field failed');

		// await this.channelUsersRepository.softDeleteUserFromChannel(
		// 	receiverChannelUserId,
		// );
	}

	async muteChannelUser(giverUserId: number, receiverChannelUserId: number) {
		// 유효한 channelUserId인지 확인
		const receiverChannelUser = await this.checkChannelUserExist(
			receiverChannelUserId,
		);

		// channel 유효성 확인
		const channelId = receiverChannelUser.channelId;
		await this.checkChannelExist(channelId);

		// giver user 유효성 확인 (channel에 속한 user인지, 권한 없는 member인지)
		const giverChannelUser = await this.checkUserExistInChannel(
			giverUserId,
			channelId,
		);

		if (giverChannelUser.channelUserType === ChannelUserType.MEMBER)
			throw new BadRequestException(
				`kicker ${giverUserId} does not have authority`,
			);

		// receiver user 유효성 확인 (존재하는 user인지)
		const receiverUserId = receiverChannelUser.userId;
		await this.checkUserExist(receiverUserId);

		// admin -> owner/admin 권한 행사 불가
		if (giverChannelUser.channelUserType === ChannelUserType.ADMIN) {
			if (
				receiverChannelUser.channelUserType === ChannelUserType.OWNER ||
				receiverChannelUser.channelUserType === ChannelUserType.ADMIN
			)
				throw new BadRequestException(
					`admin user ${giverUserId} cannot mute the owner/admin user ${receiverUserId}`,
				);
		}

		// TODO: cache 생성
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
		const dmChannelUser = await this.channelsRepository.findDmChannelUser(
			userId,
			targetUserId,
		);

		if (dmChannelUser) {
			throw new BadRequestException(
				`DM channel already exists between ${userId} and ${targetUserId}`,
			);
		}
	}

	private async checkUserExist(userId: number) {
		const user = this.usersRepository.findOne({
			where: { id: userId },
		});
		if (!user)
			throw new BadRequestException(`user ${userId} doesn't exist`);
	}

	private async checkChannelExist(channelId: number) {
		const channel = await this.channelsRepository.findOne({
			where: { id: channelId },
		});
		if (!channel)
			throw new BadRequestException(
				`channel ${channelId} does not exist`,
			);
		return channel;
	}

	private async checkChannelUserExist(channelUserId: number) {
		const channelUser = await this.channelUsersRepository.findOne({
			where: { id: channelUserId },
		});
		if (!channelUser)
			throw new BadRequestException(`this ${channelUserId} is invalid`);
		return channelUser;
	}

	private async checkUserExistInChannel(userId: number, channelId: number) {
		const channelUser = await this.channelUsersRepository.findOne({
			where: { userId, channelId },
		});
		if (!channelUser)
			throw new BadRequestException(
				`user does not in this channel ${channelId}`,
			);
		return channelUser;
	}

	private async updateChannelType(channelId: number, newType: ChannelType) {
		const typeResult = await this.channelsRepository.update(channelId, {
			channelType: newType,
		});
		if (typeResult.affected !== 1)
			throw DBUpdateFailureException('update channel type failed');
	}

	private async updateChannelPassword(
		channelId: number,
		newPassword: string,
	) {
		const pwdResult = await this.channelsRepository.update(channelId, {
			password: newPassword,
		});
		if (pwdResult.affected !== 1)
			throw DBUpdateFailureException('update channel password failed');
	}
}
