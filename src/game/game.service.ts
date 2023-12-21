import { BadRequestException, Injectable } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateGameInvitationParamDto } from './dto/create-invitation-param.dto';
import { GatewayCreateGameInvitationParamDto } from './dto/gateway-create-invitation-param.dto';
import { GameGateway } from './game.gateway';
import { CreateInitialGameParamDto } from './dto/create-initial-game-param.dto';
import { GameInvitationRepository } from './game-invitation.repository';
import { DeleteGameInvitationParamDto } from './dto/delete-invitation-param.dto';
import { GameStatus, GameType, UserStatus } from '../common/enum';
import { acceptGameParamDto } from './dto/accept-game-param.dto';
import { EmitEventInvitationReplyDto } from './dto/emit-event-invitation-reaponse.dto';
import { User } from '../users/entities/user.entity';
import * as moment from 'moment';
import { BlocksRepository } from '../users/blocks.repository';
import { gameMatchStartParamDto } from './dto/match-game-param.dto';
import { EmitEventMatchmakingReplyDto } from './dto/emit-event-matchmaking-param.dto';
import { gameMatchDeleteParamDto } from './dto/match-game-delete-param.dto';

@Injectable()
export class GameService {
	private gameQueue: Record<string, User[]> = {
		LADDER: [],
		NORMAL_MATCHING: [],
		SPECIAL_MATCHING: [],
	};
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

	async gameMatchStart(gameMatchStartParamDto: gameMatchStartParamDto) {
		const userId = gameMatchStartParamDto.userId;
		const gameType = gameMatchStartParamDto.gameType;

		// 유저가 존재하는지
		const user = await this.checkUserExist(userId);

		if (user.status !== UserStatus.ONLINE || !user.channelSocketId)
			throw new BadRequestException(
				`유저 ${user.id} 는 OFFLINE 상태이거나 게임중입니다`,
			);
		if (
			gameType !== GameType.LADDER &&
			gameType !== GameType.NORMAL_MATCHING &&
			gameType !== GameType.SPECIAL_MATCHING
		) {
			throw new BadRequestException(`지원하지 않는 게임 타입입니다`);
		}

		const gameQueue = this.gameQueue[gameType];

		// 이미 큐에 존재하는지
		const index = gameQueue.indexOf(user);
		if (index > -1)
			throw new BadRequestException(
				`유저 ${user.id} 는 이미 매칭 큐에 존재합니다`,
			);

		gameQueue.push(user);

		if (gameQueue.length >= 2) {
			console.log(gameQueue);
			let player1 = gameQueue.shift();
			let player2 = gameQueue.shift();

			// player1 또는 2가 OFFLINE이라면 큐에서 제거시키고 다시 매칭
			while (player1 && player1.channelSocketId === null) {
				player1 = gameQueue.shift();
			}

			while (player2 && player2.channelSocketId === null) {
				player2 = gameQueue.shift();
			}

			if (
				!player1 ||
				!player2 ||
				player1.channelSocketId === null ||
				player2.channelSocketId === null
			)
				throw new BadRequestException(
					`게임 매칭 큐에 유저가 2명 이상이어야 합니다`,
				);

			const gameDto = new CreateInitialGameParamDto(
				player1.id,
				player2.id,
				gameType,
				GameStatus.WAITING,
			);
			const game = await this.gameRepository.createGame(gameDto);

			const invitationReplyToPlayer1Dto: EmitEventMatchmakingReplyDto = {
				targetUserId: player1.id,
				targetUserChannelSocketId: player1.channelSocketId,
				gameId: game.id,
			};
			const invitationReplyToPlayer2Dto: EmitEventMatchmakingReplyDto = {
				targetUserId: player2.id,
				targetUserChannelSocketId: player2.channelSocketId,
				gameId: game.id,
			};

			await this.gameGateway.sendMatchmakingReply(
				invitationReplyToPlayer1Dto,
			);
			await this.gameGateway.sendMatchmakingReply(
				invitationReplyToPlayer2Dto,
			);
		}
	}

	async gameMatchCancel(gameMatchCancelParamDto: gameMatchDeleteParamDto) {
		const userId = gameMatchCancelParamDto.userId;
		const gameType = gameMatchCancelParamDto.gameType;

		// 유저가 존재하는지
		const user = await this.checkUserExist(userId);

		if (user.status !== UserStatus.ONLINE || !user.channelSocketId)
			throw new BadRequestException(
				`유저 ${user.id} 는 OFFLINE 상태이거나 게임중입니다`,
			);

		if (
			gameType !== GameType.LADDER &&
			gameType !== GameType.NORMAL_MATCHING &&
			gameType !== GameType.SPECIAL_MATCHING
		) {
			throw new BadRequestException(`지원하지 않는 게임 타입입니다`);
		}

		const gameQueue = this.gameQueue[gameType];

		const index = gameQueue.indexOf(user);
		if (index > -1) {
			gameQueue.splice(index, 1);
		} else if (index === -1)
			throw new BadRequestException(
				`유저 ${user.id} 는 매칭 큐에 존재하지 않습니다`,
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
