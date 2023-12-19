import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { UsersRepository } from '../users/users.repository';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { UseFilters } from '@nestjs/common';
import { WsExceptionFilter } from '../common/exception/custom-ws-exception.filter';
import { GatewayCreateGameInvitationParamDto } from './dto/gateway-create-invitation-param.dto';
import {
	EVENT_GAME_INVITATION,
	EVENT_GAME_INVITATION_REPLY,
	EVENT_GAME_START,
	EVENT_MATCH_SCORE,
	EVENT_MATCH_STATUS,
} from '../common/events';
import { ChannelsGateway } from '../channels/channels.gateway';
import { EmitEventInvitationReplyDto } from './dto/emit-event-invitation-reaponse.dto';
import { GameRepository } from './game.repository';
import { WSBadRequestException } from '../common/exception/custom-exception';
import { GameDto } from './dto/game.dto';
import { GameStatus, UserStatus } from '../common/enum';
import { EmitEventMatchScoreParamDto } from './dto/emit-event-match-score-param.dto';
import { EmitEventMatchStatusDto } from './dto/emit-event-match-status.dto';
import { CreateGameParamDto } from './dto/create-game-param.dto';

@WebSocketGateway({ namespace: 'game' })
@UseFilters(WsExceptionFilter)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private readonly authService: AuthService,
		private readonly usersRepository: UsersRepository,
		private readonly gameRepository: GameRepository,
		private readonly channelsGateway: ChannelsGateway,
	) {}

	@WebSocketServer()
	server: Server;
	private userIdToClient: Map<number, Socket> = new Map();
	private userIdToGameId: Map<number, number> = new Map();
	private gameIdToGameDto: Map<number, GameDto> = new Map();

	async handleConnection(@ConnectedSocket() client: Socket) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user || !client.id || user.gameSocketId)
			return client.disconnect();

		console.log(`${user.id} is connected to game socket {${client.id}}`);

		// 연결된 게임소켓 id를 저장한다.
		await this.usersRepository.update(user.id, {
			gameSocketId: client.id,
		});
		this.userIdToClient.set(user.id, client);
	}

	async handleDisconnect(@ConnectedSocket() client: Socket) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user || client.id !== user.gameSocketId) return;

		await this.usersRepository.update(user.id, {
			gameSocketId: null,
		});

		const gameId = this.userIdToGameId.get(user.id);
		if (gameId) {
			const gameDto = this.gameIdToGameDto.get(gameId);
			if (gameDto) {
				if (gameDto.gameStatus === GameStatus.PLAYING)
					gameDto.gameInterrupted = true;
				this.gameIdToGameDto.delete(gameId);
			}
			this.userIdToGameId.delete(user.id);
		}
		this.userIdToClient.delete(user.id);

		client.rooms.clear();
	}

	async inviteGame(
		gatewayInvitationParamDto: GatewayCreateGameInvitationParamDto,
	) {
		const invitedUserChannelSocketId =
			gatewayInvitationParamDto.invitedUserChannelSocketId;
		const invitationId = gatewayInvitationParamDto.invitationId;
		const invitingUserNickname =
			gatewayInvitationParamDto.invitingUserNickname;
		const gameType = gatewayInvitationParamDto.gameType;

		this.channelsGateway.server
			.to(invitedUserChannelSocketId)
			.emit(EVENT_GAME_INVITATION, {
				invitationId: invitationId,
				invitingUserNickname: invitingUserNickname,
				gameType: gameType,
			});
	}

	async sendInvitationReply(
		sendInvitationReplyDto: EmitEventInvitationReplyDto,
	) {
		const targetUserId = sendInvitationReplyDto.targetUserId;
		const targetUserChannelSocketId =
			sendInvitationReplyDto.targetUserChannelSocketId;
		const isAccepted = sendInvitationReplyDto.isAccepted;
		const gameId = sendInvitationReplyDto.gameId;

		this.channelsGateway.server
			.to(targetUserChannelSocketId)
			.emit(EVENT_GAME_INVITATION_REPLY, {
				isAccepted: isAccepted,
				gameId: gameId,
			});
	}

	@SubscribeMessage('gameRequest')
	async prepareGame(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { gameId: number },
	) {
		/* TODO: Game 세팅
		 *	1. game Data 만들기
		 *
		 * 	2. map 준비하기 ✅
		 * 	3. game room join하기 ✅
		 * 	4. INGAME으로 상태 바꾸기 ✅
		 * 	5. game start event emit ✅*/
		const user = await this.authService.getUserFromSocket(client);
		if (!user) return client.disconnect();

		const game = await this.gameRepository.findOne({
			where: { id: data.gameId },
		});
		if (!game)
			throw WSBadRequestException(
				`game id ${data.gameId} 는 유효하지 않습니다`,
			);

		const gameDto = new GameDto(game);
		const gameId = this.userIdToGameId.get(user.id);
		if (gameId) {
			const gameDto = this.gameIdToGameDto.get(gameId);
			if (gameDto) {
				// userId -> gameId -> game이 아직 있는데
				if (
					gameDto.playerLeftId !== user.id &&
					gameDto.playerRightId !== user.id
				) {
					// user가 player가 아니라면
					throw WSBadRequestException(
						`유저에게 진행 중이거나 처리되지 않은 다른 game id ${gameId}가 있습니다`,
					);
				}
			}
			this.userIdToGameId.delete(user.id);
		}
		this.userIdToGameId.set(user.id, game.id);
		this.gameIdToGameDto.set(game.id, gameDto);

		const playerLeftSocket = this.userIdToClient.get(gameDto.playerLeftId);
		const playerRightSocket = this.userIdToClient.get(
			gameDto.playerRightId,
		);
		if (!playerLeftSocket || !playerRightSocket)
			throw WSBadRequestException(
				`두 플레이어의 게임 소켓이 모두 필요합니다. 게임 불가`,
			);

		playerLeftSocket.join(gameDto.getGameId().toString());
		playerRightSocket.join(gameDto.getGameId().toString());

		// 4. INGAME으로 상태 바꾸기
		await this.usersRepository.update(user.id, {
			status: UserStatus.INGAME,
		});
	}

	@SubscribeMessage('matchKeyDown')
	async updateBallAndRacket(
		@ConnectedSocket() client: Socket,
		@MessageBody()
		data: {
			gameId: number;
			keyStatus: string;
			keyName: string;
		},
	) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user) return client.disconnect();

		const gameDto = this.gameIdToGameDto.get(data.gameId);
		if (!gameDto) {
			throw WSBadRequestException(
				`유저가 진행 중인 게임을 찾지 못했습니다`,
			);
		} else {
			if (
				gameDto.playerLeftId !== user.id &&
				gameDto.playerRightId !== user.id
			) {
				// user가 player가 아니라면
				throw WSBadRequestException(
					`유저에게 해당하는 게임이 아닙니다`,
				);
			}
		}

		if (data.keyStatus === 'down') {
			if (user.id === gameDto.playerLeftId)
				gameDto.viewMap.updateRacketLeft(data.keyName);
			else gameDto.viewMap.updateRacketRight(data.keyName);
		}
	}

	@SubscribeMessage('gameReady')
	async gaming(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { gameId: number },
	) {
		/* TODO:
		 *   	1. ball racket update emit
		 * 		2. score update, emit -> restart
		 * 		3. 둘 중 하나 끊겼는지 확인하고 승패 처리 -> gameEnd(game DB 저장, gameIdToGameDto에서 game을 지우기)
		 * 		4. max score인지 확인 -> gameEnd
		 * 		5. init하기
		 * */
		// auth guard
		const user = await this.authService.getUserFromSocket(client);
		if (!user) return client.disconnect;

		const gameDto = this.gameIdToGameDto.get(data.gameId);
		if (!gameDto) throw WSBadRequestException('유효하지 않은 게임입니다');

		const playerLeftSocket = this.userIdToClient.get(gameDto.playerLeftId);
		const playerRightSocket = this.userIdToClient.get(
			gameDto.playerRightId,
		);
		if (!playerLeftSocket || !playerRightSocket)
			throw WSBadRequestException(
				`두 플레이어의 게임 소켓이 모두 필요합니다. 게임 불가`,
			);

		gameDto.readyCnt++;
		if (gameDto.bothReady()) {
			this.server
				.to(gameDto.getGameId().toString())
				.emit(EVENT_GAME_START);
		} else return;

		const intervalId: NodeJS.Timeout = setInterval(async () => {
			const viewMap = gameDto.viewMap;

			// update objects
			const updateDto = await viewMap.changes();

			// emit update objects to each user
			const playerLeftMatchStatusDto: EmitEventMatchStatusDto = {
				myRacket: updateDto.racketLeft,
				rivalRacket: updateDto.racketRight,
				ball: updateDto.ball,
			};
			const playerRightMatchStatusDto: EmitEventMatchStatusDto = {
				myRacket: updateDto.racketRight,
				rivalRacket: updateDto.racketLeft,
				ball: updateDto.ball,
			};
			this.server
				.to(playerLeftSocket.id)
				.emit(EVENT_MATCH_STATUS, playerLeftMatchStatusDto);
			this.server
				.to(playerRightSocket.id)
				.emit(EVENT_MATCH_STATUS, playerRightMatchStatusDto);

			// update score
			if (updateDto.isScoreChanged()) {
				if (updateDto.scoreLeft) gameDto.scoreLeft++;
				else if (updateDto.scoreRight) gameDto.scoreRight++;

				//emit score to each user
				const playerLeftMatchScoreDto: EmitEventMatchScoreParamDto = {
					myScore: gameDto.scoreLeft,
					rivalScore: gameDto.scoreRight,
				};
				const playerRightMatchScoreDto: EmitEventMatchScoreParamDto = {
					myScore: gameDto.scoreRight,
					rivalScore: gameDto.scoreLeft,
				};
				this.server
					.to(playerLeftSocket.id)
					.emit(EVENT_MATCH_SCORE, playerLeftMatchScoreDto);
				this.server
					.to(playerRightSocket.id)
					.emit(EVENT_MATCH_SCORE, playerRightMatchScoreDto);

				if (gameDto.isOver()) {
					clearInterval(intervalId);
					await this.gameEnd(gameDto);
				} else await this.gameRestart(gameDto);
			}
			if (
				!(await this.isSocketConnected(playerLeftSocket)) ||
				!(await this.isSocketConnected(playerRightSocket))
			) {
				clearInterval(intervalId);
				await this.gameEnd(gameDto);
			}
		}, 1000 / 60);
	}

	async gameEnd(gameDto: GameDto) {
		// game DB update
		const winnerId =
			gameDto.scoreLeft > gameDto.scoreRight
				? gameDto.playerLeftId
				: gameDto.playerRightId;
		const loserId =
			gameDto.scoreLeft < gameDto.scoreRight
				? gameDto.playerLeftId
				: gameDto.playerRightId;

		const winnerScore =
			gameDto.scoreLeft > gameDto.scoreRight
				? gameDto.scoreLeft
				: gameDto.scoreRight;
		const loserScore =
			gameDto.scoreLeft < gameDto.scoreRight
				? gameDto.scoreLeft
				: gameDto.scoreRight;

		const gameResult = new CreateGameParamDto(
			gameDto,
			winnerId,
			loserId,
			winnerScore,
			loserScore,
			GameStatus.FINISHED,
		);
		await this.gameRepository.update(gameDto.getGameId(), gameResult);

		// gameDto 지워주기
		this.gameIdToGameDto.delete(gameDto.getGameId());
	}

	async gameRestart(gameDto: GameDto) {
		await gameDto.viewMap.init();
	}

	private async isSocketConnected(client: Socket) {
		const socket = (await this.server.fetchSockets()).find(
			(s) => s.id === client.id,
		);
		if (!socket) {
			return false;
		}
		return true;
	}
}
