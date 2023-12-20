import { BadRequestException, Injectable } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateGameInvitationParamDto } from './dto/create-invitation-param.dto';
import { GatewayCreateGameInvitationParamDto } from './dto/gateway-create-invitation-param.dto';
import { GameGateway } from './game.gateway';
import { CreateInitialGameParamDto } from './dto/create-initial-game-param.dto';
import { GameInvitationRepository } from './game-invitation.repository';
import { DeleteGameInvitationParamDto } from './dto/delete-invitation-param.dto';
import { GameStatus, UserStatus } from '../common/enum';
import { acceptGameParamDto } from './dto/accept-game-param.dto';
import { EmitEventInvitationReplyDto } from './dto/emit-event-invitation-reply.dto';
import { User } from '../users/entities/user.entity';
import * as moment from 'moment';
import { BlocksRepository } from '../users/blocks.repository';

@Injectable()
export class GameService {
	constructor(
		private readonly gameRepository: GameRepository,
		private readonly gameInvitationRepository: GameInvitationRepository,
		private readonly gameGateway: GameGateway,
		private readonly usersRepository: UsersRepository,
		private readonly blocksRepository: BlocksRepository,
	) {}

	async createInvitation(invitationParamDto: CreateGameInvitationParamDto) {
		const invitingUser = invitationParamDto.invitingUser;
		const invitedUserId = invitationParamDto.invitedUserId;
		const gameType = invitationParamDto.gameType;

		// 본인 스스로인지
		if (invitingUser.id === invitedUserId)
			throw new BadRequestException('자기 자신을 초대할 수 없습니다');

		// 상대가 존재하는 유저인지
		const invitedUser = await this.checkUserExist(invitedUserId);

		// 상대가 OFFLINE / INGAME이면 없던 일이 됨
		if (
			invitedUser.status !== UserStatus.ONLINE ||
			!invitedUser.channelSocketId
		)
			throw new BadRequestException(
				`초대된 유저 ${invitedUserId} 는 OFFLINE 상태이거나 게임 중입니다`,
			);

		const isBlocked = await this.blocksRepository.findOne({
			where: { fromUserId: invitedUserId, toUserId: invitingUser.id },
		});
		if (isBlocked) return;

		// 10초 내로 같은 초대를 요청한 적이 있는지
		const olderInvitation = await this.gameInvitationRepository.findOne({
			where: {
				invitingUserId: invitingUser.id,
				invitedUserId: invitedUser.id,
			},
			order: { createdAt: 'DESC' },
		});

		if (olderInvitation) {
			const currentTime = moment();
			const diff = currentTime.diff(olderInvitation.createdAt, 'seconds');

			if (diff < 10) {
				throw new BadRequestException(
					`아직 응답을 기다리고 있는 초대입니다`,
				);
			} else {
				await this.gameInvitationRepository.softDelete({
					invitingUserId: invitingUser.id,
					invitedUserId: invitedUser.id,
				});
			}
		}

		// game invitation DB 저장
		const gameInvitation =
			await this.gameInvitationRepository.createGameInvitation(
				invitationParamDto,
			);

		// TODO: 알림 보내기
		const gatewayInvitationParamDto: GatewayCreateGameInvitationParamDto = {
			invitationId: gameInvitation.id,
			invitingUserNickname: invitingUser.nickname,
			invitedUserChannelSocketId: invitedUser.channelSocketId,
			gameType: gameType,
		};
		await this.gameGateway.inviteGame(gatewayInvitationParamDto);

		const createInvitationResponseDto = {
			gameInvitationId: gameInvitation.id,
		};
		return createInvitationResponseDto;
	}

	async createGame(createGameParamDto: acceptGameParamDto) {
		const invitationId = createGameParamDto.invitationId;
		const invitedUser = createGameParamDto.invitedUser;

		const invitation = await this.gameInvitationRepository.findOne({
			where: {
				id: invitationId,
				invitedUserId: invitedUser.id,
			},
		});
		if (!invitation)
			throw new BadRequestException(
				`해당하는 invitation id ${invitationId} 가 없습니다`,
			);

		// 10초 지나면 유효하지 않은 초대
		const currentTime = moment();
		const diff = currentTime.diff(invitation.createdAt, 'seconds');

		if (diff >= 10) {
			throw new BadRequestException(
				`시간초과로 유효하지 않은 요청입니다`,
			);
		}

		// 두 유저 모두 ONLINE 인지 확인
		if (
			invitedUser.status !== UserStatus.ONLINE ||
			!invitedUser.channelSocketId
		)
			throw new BadRequestException(
				`초대된 유저 ${invitedUser.id} 는 OFFLINE 상태이거나 게임중입니다`,
			);
		const invitingUser = await this.checkUserExist(
			invitation.invitingUserId,
		);
		if (
			invitingUser.status !== UserStatus.ONLINE ||
			!invitingUser.channelSocketId
		)
			throw new BadRequestException(
				`초대한 유저 ${invitingUser.id} 는 OFFLINE 상태이거나 게임중입니다`,
			);

		/* TODO: DB에 쌓인 유효하지 않은 초대장들은 어떻게 지우지 ?
		 *	1. cache-manager ttl을 쓴다
		 *	2. cron을 쓴다
		 * 	3. 그냥 놔둔다
		 * 	4. 트리거가 되는 요청 때 기회는 이때다! 지워버린다
		 *	일단 4가 채택됨 -> 취소 및 거절시 해당하는 invitation이 있을 때 */

		/* TODO: Game 세팅
		 *	1. game Data 만들기 ✅
		 *
		 * 	2. game room join하기
		 * 	3. game start event emit */

		const plyer1Id = invitingUser.id;
		const plyer2Id = invitedUser.id;
		const gameType = invitation.gameType;

		const gameDto = new CreateInitialGameParamDto(
			plyer1Id,
			plyer2Id,
			gameType,
			GameStatus.WAITING,
		);
		const game = await this.gameRepository.createGame(gameDto);

		// 성사됐으니까 game invitation 지워주기
		await this.gameInvitationRepository.softDelete(invitationId);

		// 두 유저에게 game id emit
		const invitationReplyToInvitingUserDto: EmitEventInvitationReplyDto = {
			targetUserId: invitingUser.id,
			targetUserChannelSocketId: invitingUser.channelSocketId,
			isAccepted: true,
			gameId: game.id,
		};
		const invitationReplyToInvitedUserDto: EmitEventInvitationReplyDto = {
			targetUserId: invitedUser.id,
			targetUserChannelSocketId: invitedUser.channelSocketId,
			isAccepted: true,
			gameId: game.id,
		};

		await this.gameGateway.sendInvitationReply(
			invitationReplyToInvitingUserDto,
		);
		await this.gameGateway.sendInvitationReply(
			invitationReplyToInvitedUserDto,
		);
	}

	async deleteInvitationByInvitingUserId(
		deleteInvitationParamDto: DeleteGameInvitationParamDto,
	) {
		const invitationId = deleteInvitationParamDto.invitationId;
		const invitingUserId = deleteInvitationParamDto.cancelingUserId;

		const invitation = await this.gameInvitationRepository.findOne({
			where: {
				id: invitationId,
				invitingUserId: invitingUserId,
			},
		});
		if (!invitation)
			throw new BadRequestException(
				`해당하는 invitation id ${invitationId} 가 없습니다`,
			);

		// 10초 지나면 유효하지 않은 취소 (악의 취소)
		const currentTime = moment();
		const diff = currentTime.diff(invitation.createdAt, 'seconds');

		if (diff >= 10) {
			throw new BadRequestException(
				`시간초과로 유효하지 않은 요청입니다`,
			);
		}

		await this.gameInvitationRepository.softDelete(invitationId);
	}

	async deleteInvitationByInvitedUserId(
		deleteInvitationParamDto: DeleteGameInvitationParamDto,
	) {
		const invitationId = deleteInvitationParamDto.invitationId;
		const invitedUserId = deleteInvitationParamDto.cancelingUserId;

		const invitation = await this.gameInvitationRepository.findOne({
			where: {
				id: invitationId,
				invitedUserId: invitedUserId,
			},
		});
		if (!invitation)
			throw new BadRequestException(
				`해당하는 invitation id ${invitationId} 가 없습니다`,
			);
		// 10초 지나면 유효하지 않은 취소 (악의 취소)
		const currentTime = moment();
		const diff = currentTime.diff(invitation.createdAt, 'seconds');

		if (diff >= 10) {
			throw new BadRequestException(
				`시간초과로 유효하지 않은 요청입니다`,
			);
		}

		await this.gameInvitationRepository.softDelete(invitationId);

		// 초대 보낸 사람에게 초대가 거절됨을 알려야함
		// 초대 보낸 사람이 ONLINE 인지 확인
		const invitingUser = await this.checkUserExist(
			invitation.invitingUserId,
		);
		if (
			invitingUser.status === UserStatus.OFFLINE ||
			!invitingUser.channelSocketId
		)
			throw new BadRequestException(
				`초대한 유저 ${invitingUser.id} 는 OFFLINE 상태입니다`,
			);

		const sendInvitationReplyDto: EmitEventInvitationReplyDto = {
			targetUserId: invitingUser.id,
			targetUserChannelSocketId: invitingUser.channelSocketId,
			isAccepted: false,
			gameId: null,
		};

		await this.gameGateway.sendInvitationReply(sendInvitationReplyDto);
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
}
