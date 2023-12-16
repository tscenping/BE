import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as bycrypt from 'bcrypt';
import { Redis } from 'ioredis';
import { MUTE_TIME } from 'src/common/constants';
import { ChannelType, ChannelUserType } from 'src/common/enum';
import { GatewayCreateChannelInvitationParamDto } from 'src/game/dto/gateway-create-channelInvitation-param-dto';
import { User } from 'src/users/entities/user.entity';
import { UsersRepository } from 'src/users/users.repository';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { ChannelInvitationRepository } from './channel-invitation.repository';
import { ChannelUsersRepository } from './channel-users.repository';
import { ChannelsGateway } from './channels.gateway';
import { ChannelsRepository } from './channels.repository';
import { ChannelInvitationListResponseDto } from './dto/channel-Invitation-list-response.dto';
import { ChannelInvitationParamDto } from './dto/channel-Invitation.dto';
import { ChannelListResponseDto } from './dto/channel-list-response.dto';
import { ChannelListReturnDto } from './dto/channel-list-return.dto';
import { ChannelUserInfoReturnDto } from './dto/channel-user-info-return.dto';
import { ChannelUsersResponseDto } from './dto/channel-users-response.dto';
import { CreateChannelRequestDto } from './dto/creat-channel-request.dto';
import { CreateChannelResponseDto } from './dto/create-channel-response.dto';
import { CreateChannelUserParamDto } from './dto/create-channel-user-param.dto';
import { CreateInvitationParamDto } from './dto/create-invitation-param.dto';
import { DeleteChannelInvitationParamDto } from './dto/delete-invitation-param.dto';
import { DmChannelListResponseDto } from './dto/dmchannel-list-response.dto';
import { DmChannelListReturnDto } from './dto/dmchannel-list-return.dto';
import { UpdateChannelPwdParamDto } from './dto/update-channel-pwd-param.dto';

@Injectable()
export class ChannelsService {
	constructor(
		private readonly channelsRepository: ChannelsRepository,
		private readonly channelUsersRepository: ChannelUsersRepository,
		private readonly channelInvitationRepository: ChannelInvitationRepository,
		private readonly usersRepository: UsersRepository,
		private readonly ChannelsGateway: ChannelsGateway,
		@InjectRedis() private readonly redis: Redis,
	) {}

	private readonly logger = new Logger(ChannelsService.name);

	async createChannel(
		userId: number,
		channelInfo: CreateChannelRequestDto,
	): Promise<CreateChannelResponseDto> {
		// DM 채널인 경우 예외 처리
		if (channelInfo.channelType === ChannelType.DM) {
			const channelId = await this.validateDmChannel(
				userId,
				channelInfo.userId!,
			);
			// 이미 DM 채널이 존재한다면 해당 채널에 대한 정보를 반환한다.
			if (channelId) {
				const channelUserInfoList =
					await this.channelUsersRepository.findChannelUserInfoList(
						userId,
						channelId,
					);
				const myChannelUserType = channelUserInfoList.find(
					(channelUser) => channelUser.userId === userId,
				)!.channelUserType;

				const createChannelResponseDto = {
					channelId,
					channelUsers: channelUserInfoList,
					myChannelUserType,
				};
				return createChannelResponseDto;
			}
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

		// DM 일 경우 상대방도 channelUsers에 추가
		if (channel.channelType === ChannelType.DM) {
			const targetChannelUser = this.channelUsersRepository.create({
				channelId: channel.id,
				userId: channelInfo.userId!,
				channelUserType: ChannelUserType.MEMBER,
			});

			await this.channelUsersRepository.save(targetChannelUser);

			++userCount;
		}

		// channelUserList 조회
		const channelUserInfoList =
			await this.channelUsersRepository.findChannelUserInfoList(
				userId,
				channel.id,
			);
		// // 채널에 소환된 유저에게 알람 전송. DM의 경우에만 해당
		// if (channel.channelType === ChannelType.DM) {
		// 	console.log(`channelInfo.userId: ${channelInfo.userId}`)
		// 	const targetUser = await this.usersRepository.findOne({
		// 		where: { id: channelInfo.userId },
		// 	});
		// 	if (targetUser?.channelSocketId) {
		// 		this.ChannelsGateway.sendChannelAlert(
		// 			channel.id,
		// 			[targetUser.channelSocketId],
		// 		);
		// 	}
		// }

		// TODO: cache에 user count 저장
		this.logger.log(
			`channel ${channel.id} is created. user count: ${userCount}`,
		);

		const createChannelResponseDto = {
			channelId: channel.id,
			channelUsers: channelUserInfoList,
			myChannelUserType: ChannelUserType.OWNER,
		};
		return createChannelResponseDto;
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

		const newPassword = updateChannelPwdParamDto.password;
		if (!newPassword) {
			// input password가 null일 때
			if (channel.channelType === ChannelType.PROTECTED) {
				await this.updateChannelType(channelId, ChannelType.PUBLIC);
			}
		} else {
			const channelPassword = channel.password as string | null;
			if (channelPassword) {
				// input password !== null && origin password !== null
				if (bycrypt.compareSync(newPassword, channelPassword)) {
					throw new BadRequestException(
						'new password is same as the older one',
					);
				}
			}
			await this.updateChannelPassword(channelId, newPassword);
			if (channel.channelType === ChannelType.PUBLIC) {
				await this.updateChannelType(channelId, ChannelType.PROTECTED);
			}
		}
	}

	async createChannelUser(
		channelUserParamDto: CreateChannelUserParamDto,
	): Promise<ChannelUsersResponseDto> {
		const channelId = channelUserParamDto.channelId;
		const userId = channelUserParamDto.userId;
		const password = channelUserParamDto.password;

		// 존재하는 channel인지 확인
		const channel = await this.checkChannelExist(channelId);

		// user가 channel에 없는지, ban 당한 적이 없는지 확인
		const channelUser = await this.channelUsersRepository.findOne({
			where: { userId, channelId },
			withDeleted: true,
			order: { createdAt: 'DESC' },
		});
		if (
			channelUser &&
			((channelUser.deletedAt !== null && channelUser.isBanned) ||
				channelUser.deletedAt === null)
		) {
			throw new BadRequestException(
				`유저는 채널에 이미 참여중이거나, 밴 당한 이력이 있습니다.`,
			);
		}

		// channel이 프로텍티드라면 비밀번호가 맞는지 확인
		if (channel.channelType === ChannelType.PROTECTED) {
			if (!password) {
				throw new BadRequestException('비밀번호를 입력해주세요.');
			}

			const isPasswordMatching = await bycrypt.compare(
				password,
				channel.password!,
			);
			if (!isPasswordMatching) {
				throw new BadRequestException('비밀번호가 일치하지 않습니다.');
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
		const channelUser = await this.channelUsersRepository.findOne({
			where: { userId: invitedUserId, channelId: channelId },
		});

		if (channelUser) {
			throw new BadRequestException(
				`user already in this channel ${channelId}`,
			);
		}

		const channelInvitation =
			await this.channelInvitationRepository.createChannelInvitation(
				createInvitationParamDto,
			);

		const gatewayInvitationParamDto: GatewayCreateChannelInvitationParamDto =
			{
				invitationId: channelInvitation.id,
				invitingUserId: invitingUserId,
				invitedUserId: invitedUserId,
			};
		await this.ChannelsGateway.privateAlert(gatewayInvitationParamDto);
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
		if (giverChannelUser.channelUserType !== ChannelUserType.OWNER) {
			throw new BadRequestException(
				`giver ${giverUserId} does not have authority`,
			);
		}

		// receiver user 유효성 확인 (존재하는 user인지)
		const receiverUserId = receiverChannelUser.userId;
		await this.checkUserExist(receiverUserId);

		// 임명 / 해제 처리
		const result = await this.channelUsersRepository.updateChannelUserType(
			receiverChannelUserId,
		);

		const receiverUserProfile = await this.usersRepository.findOne({
			where: { id: receiverUserId },
		});

		return {
			isAdmin: result.channelUserType === ChannelUserType.ADMIN,
			receiverUserProfile: receiverUserProfile!,
		};
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
					`admin user ${giverUserId} cannot kick the owner/admin user ${receiverUserId}`,
				);
		}

		const receiverUserProfile = await this.usersRepository.findOne({
			where: { id: receiverUserId },
		});

		await this.channelUsersRepository.softDeleteUserFromChannel(
			receiverChannelUserId,
		);

		return receiverUserProfile!;
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
				`banding user ${giverUserId} does not have authority`,
			);

		// receiver user 유효성 확인 (존재하는 user인지)
		const receiverUserId = receiverChannelUser.userId;
		await this.checkUserExist(receiverUserId);

		// admin -> owner/admin 권한 행사 불가
		if (giverChannelUser.channelUserType === ChannelUserType.ADMIN) {
			if (
				receiverChannelUser.channelUserType === ChannelUserType.OWNER ||
				receiverChannelUser.channelUserType === ChannelUserType.ADMIN
			) {
				throw new BadRequestException(
					`admin user ${giverUserId} cannot ban the owner/admin user ${receiverUserId}`,
				);
			}
		}

		const receiverUserProfile = await this.usersRepository.findOne({
			where: { id: receiverUserId },
		});

		const result = await this.channelUsersRepository.update(
			receiverChannelUserId,
			{
				isBanned: true,
			},
		);
		if (result.affected !== 1)
			throw DBUpdateFailureException('update isBanned property failed');

		await this.channelUsersRepository.softDeleteUserFromChannel(
			receiverChannelUserId,
		);

		return receiverUserProfile!;
	}

	async muteChannelUser(giverUser: User, receiverChannelUserId: number) {
		// 유효한 channelUserId인지 확인
		const receiverChannelUser = await this.checkChannelUserExist(
			receiverChannelUserId,
		);

		// channel 유효성 확인
		const channelId = receiverChannelUser.channelId;
		await this.checkChannelExist(channelId);

		// giver user 유효성 확인 (channel에 속한 user인지, 권한 없는 member인지)
		const giverChannelUser = await this.checkUserExistInChannel(
			giverUser.id,
			channelId,
		);

		if (giverChannelUser.channelUserType === ChannelUserType.MEMBER)
			throw new BadRequestException(
				`muting user ${giverUser.id} does not have authority`,
			);

		// receiver user 유효성 확인 (존재하는 user인지)
		const receiverUserId = receiverChannelUser.userId;
		const receiverUser = await this.checkUserExist(receiverUserId);

		// admin -> owner/admin 권한 행사 불가
		if (giverChannelUser.channelUserType === ChannelUserType.ADMIN) {
			if (
				receiverChannelUser.channelUserType === ChannelUserType.OWNER ||
				receiverChannelUser.channelUserType === ChannelUserType.ADMIN
			) {
				throw new BadRequestException(
					`admin user ${giverUser.id} cannot mute the owner/admin user ${receiverUserId}`,
				);
			}
		}

		const receiverUserProfile = await this.usersRepository.findOne({
			where: { id: receiverUserId },
		});

		// redis에 mute 정보 저장
		const muteKey = `mute:${channelId}:${receiverUser.id}`;
		// redis에 mute 정보 저장
		await this.redis.set(muteKey, '');
		// mute 정보 만료 시간 설정
		await this.redis.expire(muteKey, MUTE_TIME); // TODO: 30초로 변경

		return receiverUserProfile!;
	}

	async findAllChannels(
		userId: number,
		page: number,
	): Promise<ChannelListResponseDto> {
		const channels: ChannelListReturnDto[] =
			await this.channelsRepository.findAllChannels(userId, page);
		const totalDataSize: number = await this.channelsRepository.count({
			where: {
				channelType: ChannelType.PUBLIC || ChannelType.PROTECTED,
			},
		});
		if (!channels) {
			throw new BadRequestException(`There is no channel`);
		}
		return { channels, totalDataSize };
	}

	async findMyChannels(
		userId: number,
		page: number,
	): Promise<ChannelListResponseDto> {
		const channels: ChannelListReturnDto[] =
			await this.channelsRepository.findMyChannels(userId, page);
		const totalDataSize: number =
			await this.channelsRepository.countInvolved(userId);
		if (!channels) {
			throw new BadRequestException(`There is no 'my channel'`);
		}

		return { channels, totalDataSize };
	}

	async findDmChannels(
		userId: number,
		page: number,
	): Promise<DmChannelListResponseDto> {
		const dmChannels: DmChannelListReturnDto[] =
			await this.channelsRepository.findDmChannels(userId, page);
		const totalItemCount: number = await this.channelsRepository.count({
			where: {
				channelType: ChannelType.DM,
			},
		});
		if (!dmChannels) {
			throw new BadRequestException(`There is no 'dm channel'`);
		}
		return { dmChannels, totalItemCount };
	}

	async acceptInvitation(
		createChannelUserParamDto: ChannelInvitationParamDto,
	): Promise<ChannelInvitationListResponseDto> {
		const channelInvitationInfo =
			await this.channelInvitationRepository.findOne({
				where: {
					id: createChannelUserParamDto.invitationId,
				},
			});
		if (!channelInvitationInfo?.channelId || !channelInvitationInfo.id)
			throw new BadRequestException(
				`channel ${channelInvitationInfo?.id} does not exist`,
			);
		const channelInfo = await this.channelsRepository.findOne({
			where: {
				id: channelInvitationInfo.channelId,
			},
		});
		if (!channelInfo?.id || !channelInfo.name)
			throw new BadRequestException(
				`channel ${channelInfo?.id} does not exist`,
			);

		const channelId = channelInfo.id;
		const channelName = channelInfo.name;
		const channelUsersRepo =
			await this.channelUsersRepository.findChannelUserInfoList(
				createChannelUserParamDto.invitedUserId,
				channelId,
			);

		const channelUsers: ChannelUserInfoReturnDto[] = channelUsersRepo.map(
			(user) => ({
				...user,
				isFriend: user.isFriend,
				isBlocked: user.isBlocked,
				channelUserType: user.channelUserType,
			}),
		);

		return { channelId, channelName, channelUsers };
	}

	async rejectInvitation(
		deleteInvitationParamDto: DeleteChannelInvitationParamDto,
	) {
		const invitation = await this.channelInvitationRepository.findOne({
			where: {
				id: deleteInvitationParamDto.invitationId,
				invitedUserId: deleteInvitationParamDto.cancelingUserId,
			},
		});
		if (!invitation)
			throw new BadRequestException(
				`해당하는 invitation id ${deleteInvitationParamDto.invitationId} 가 없습니다`,
			);

		const deleteChannelInvitationParamDto: DeleteChannelInvitationParamDto =
			{
				invitationId: invitation.id,
				cancelingUserId: invitation.invitedUserId,
			};

		await this.channelInvitationRepository.deleteChannelInvitation(
			deleteChannelInvitationParamDto,
		);
	}

	async validateDmChannel(
		userId: number,
		targetUserId: number,
	): Promise<number | void> {
		// 자기 자신에게 DM 채널을 생성할 수 없음
		if (userId === targetUserId) {
			throw new BadRequestException(`cannot create DM channel to myself`);
		}

		// target user가 존재하는지 확인
		const targetUser = await this.usersRepository.findOne({
			where: {
				id: targetUserId,
			},
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
			return dmChannelUser.channelId;
		}
	}

	private async checkUserExist(userId: number): Promise<User> {
		const user = await this.usersRepository.findOne({
			where: { id: userId },
		});

		if (!user) {
			throw new BadRequestException(`user ${userId} does not exist`);
		}
		return user as User;
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
		if (!channelUser) {
			throw new BadRequestException(`this ${channelUserId} is invalid`);
		}

		const user = await this.usersRepository.findOne({
			where: { id: channelUser.userId },
		});
		if (!user) {
			throw new BadRequestException(`user does not exist`);
		}

		return channelUser;
	}

	private async checkUserExistInChannel(userId: number, channelId: number) {
		const channelUser = await this.channelUsersRepository.findOne({
			where: { userId, channelId },
		});

		if (!channelUser) {
			throw new BadRequestException(
				`user does not in this channel ${channelId}`,
			);
		}
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

	async findChannelIdByChannelUserId(channelUserId: number) {
		const channelUser = await this.channelUsersRepository.findOne({
			where: { id: channelUserId },
		});
		if (!channelUser) {
			throw new BadRequestException(
				`channelUser ${channelUserId} does not exist`,
			);
		}
		return channelUser.channelId;
	}
}
