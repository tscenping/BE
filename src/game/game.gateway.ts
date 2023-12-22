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
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsExceptionFilter } from '../common/exception/custom-ws-exception.filter';
import { GatewayCreateGameInvitationParamDto } from './dto/gateway-create-invitation-param.dto';
import {
	EVENT_GAME_INVITATION,
	EVENT_GAME_INVITATION_REPLY,
	EVENT_GAME_START,
	EVENT_MATCH_SCORE,
	EVENT_MATCH_STATUS,
	EVENT_SERVER_GAME_READY,
	EVENT_GAME_MATCHED,
} from '../common/events';
import { ChannelsGateway } from '../channels/channels.gateway';
import { EmitEventInvitationReplyDto } from './dto/emit-event-invitation-reply.dto';
import { GameRepository } from './game.repository';
import { WSBadRequestException } from '../common/exception/custom-exception';
import { GameDto } from './dto/game.dto';
import {
	GameStatus,
	GameType,
	KEYNAME,
	KEYSTATUS,
	UserStatus,
} from '../common/enum';
import { EmitEventMatchStatusDto } from './dto/emit-event-match-status.dto';
import { EmitEventMatchScoreParamDto } from './dto/emit-event-match-score-param.dto';
import { EmitEventServerGameReadyParamDto } from './dto/emit-event-server-game-ready-param.dto';
import { EmitEventMatchmakingReplyDto } from './dto/emit-event-matchmaking-param.dto';

@WebSocketGateway({ namespace: 'game' })
@UseFilters(WsExceptionFilter)
@UsePipes(ValidationPipe)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
	private userIdToClient: Map<number, Socket>;
	private userIdToGameId: Map<number, number>;
	private gameIdToGameDto: Map<number, GameDto>;

	constructor(
		private readonly authService: AuthService,
		private readonly usersRepository: UsersRepository,
		private readonly gameRepository: GameRepository,
		private readonly channelsGateway: ChannelsGateway,
	) {
		this.userIdToClient = new Map();
		this.userIdToGameId = new Map();
		this.gameIdToGameDto = new Map();
	}

	@WebSocketServer()
	server: Server;

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

	async sendMatchmakingReply(
		sendMatchmakingReplyDto: EmitEventMatchmakingReplyDto,
	) {
		const targetUserChannelSocketId =
			sendMatchmakingReplyDto.targetUserChannelSocketId;
		const gameId = sendMatchmakingReplyDto.gameId;

		this.channelsGateway.server
			.to(targetUserChannelSocketId)
			.emit(EVENT_GAME_MATCHED, {
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
		console.log(`user ${user.id} 가 게임 준비를 요청했습니다`);

		const game = await this.gameRepository.findOne({
			where: { id: data.gameId },
		});
		if (!game) {
			// 여기는 client.disconnect 해도 될 것 같다
			throw WSBadRequestException(
				`game id ${data.gameId} 데이터를 찾지 못했습니다`,
			);
		}
		console.log(`game ${game.id} 이 준비되었습니다`);

		console.log(`data.gameId: ${data.gameId}`);
		let gameDto = this.gameIdToGameDto.get(data.gameId);
		if (!gameDto) {
			gameDto = new GameDto(game);
			this.gameIdToGameDto.set(game.id, gameDto);
			this.userIdToGameId.set(user.id, gameDto.getGameId());
		}
		this.userIdToGameId.set(user.id, gameDto.getGameId());

		client.join(gameDto.getGameId().toString());

		// 4. INGAME으로 상태 바꾸기
		await this.usersRepository.update(user.id, {
			status: UserStatus.INGAME,
		});

		// rival 정보 보내기
		const rivalId =
			user.id === gameDto.playerRightId
				? gameDto.playerLeftId
				: gameDto.playerRightId;
		const rival = await this.usersRepository.findOne({
			where: { id: rivalId },
		});
		if (!rival)
			throw WSBadRequestException(`상대 ${rivalId} 가 존재하지 않습니다`);
		const eventServerGameReadyParamDto: EmitEventServerGameReadyParamDto = {
			rivalNickname: rival.nickname,
			rivalAvatar: rival.avatar,
			myPosition: rivalId === gameDto.playerRightId ? 'LEFT' : 'RIGHT',
		};

		console.log(
			'eventServerGameReadyParamDto: ',
			JSON.stringify(eventServerGameReadyParamDto),
		);

		this.server
			.to(client.id)
			.emit(EVENT_SERVER_GAME_READY, eventServerGameReadyParamDto);
	}

	@SubscribeMessage('matchKeyDown')
	async updateBallAndRacket(
		@ConnectedSocket() client: Socket,
		@MessageBody()
		data: {
			gameId: number;
			keyStatus: KEYSTATUS;
			keyName: KEYNAME;
		},
	) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user) return client.disconnect();

		const gameDto = await this.checkGameDto(data.gameId, user.id);

		console.log('----When matchKeyDown event coming, racket status----');
		console.log(`before left racket y: ${gameDto.viewMap.racketLeft.y}`);
		console.log(`before right racket y: ${gameDto.viewMap.racketRight.y}`);
		if (data.keyStatus === KEYSTATUS.down) {
			console.log('hi im gonna update racket');
			if (user.id === gameDto.playerLeftId)
				gameDto.viewMap.updateRacketLeft(data.keyName);
			else gameDto.viewMap.updateRacketRight(data.keyName);
		}
		console.log(`after left racket y: ${gameDto.viewMap.racketLeft.y}`);
		console.log(`after right racket y: ${gameDto.viewMap.racketRight.y}`);
	}

	@SubscribeMessage('clientGameReady')
	async gaming(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { gameId: number },
	) {
		/* TODO: gameLoop
		 *   	1. ball racket update, emit
		 * 		2. score update, emit -> restart
		 * 		3. 둘 중 하나 끊겼는지 확인하고 승패 처리 -> gameEnd(game DB 저장, user DB 저장, userIdToGameId에서 gameId을 지우기)
		 * 		4. max score인지 확인 -> gameEnd
		 * 		5. init하기
		 * */
		// auth guard
		const user = await this.authService.getUserFromSocket(client);
		if (!user) return client.disconnect;

		console.log(`--------${client.id} is ready--------`);

		const gameDto = await this.checkGameDto(user.id, data.gameId);

		// 유효성 검사
		const playerSockets = this.checkPlayerSockets(gameDto);

		gameDto.readyCnt++;
		console.log(`ready count: ${gameDto.readyCnt}`);
		if (gameDto.bothReady()) {
			console.log(`It's ready!`);
			gameDto.gameStatus = GameStatus.PLAYING;

			this.server.to(playerSockets.left.id).emit(EVENT_GAME_START);
			this.server.to(playerSockets.right.id).emit(EVENT_GAME_START);
		} else return;

		await this.delay(1000 * 3);
		// TODO: game restart 될 때도 3초 지연 ? how
		this.gameLoop(gameDto);
	}

	gameLoop(gameDto: GameDto) {
		console.log('Game Loop started!');
		const playerSockets = this.checkPlayerSockets(gameDto);

		let cnt = 0;
		const intervalId: NodeJS.Timeout = setInterval(async () => {
			cnt++;
			console.log(`${cnt}'th interval `);
			const viewMap = gameDto.viewMap;

			// update objects
			const updateDto = await viewMap.changes();
			console.log(
				'----In gameLoop when objects are changed, racket status----',
			);
			console.log(`left racket y: ${gameDto.viewMap.racketLeft.y}`);
			console.log(`right racket y: ${gameDto.viewMap.racketRight.y}`);

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
				.to(playerSockets.left.id)
				.emit(EVENT_MATCH_STATUS, playerLeftMatchStatusDto);
			this.server
				.to(playerSockets.right.id)
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
					.to(playerSockets.left.id)
					.emit(EVENT_MATCH_SCORE, playerLeftMatchScoreDto);
				this.server
					.to(playerSockets.right.id)
					.emit(EVENT_MATCH_SCORE, playerRightMatchScoreDto);

				if (gameDto.isOver()) {
					clearInterval(intervalId);
					await this.gameEnd(gameDto);
				} else if (
					!gameDto.gameInterrupted &&
					(await this.isSocketConnected(playerSockets.left)) &&
					(await this.isSocketConnected(playerSockets.right))
				) {
					await this.delay(1000 * 3);
					this.gameRestart(gameDto);
				}
			}
			if (
				gameDto.gameInterrupted ||
				!(await this.isSocketConnected(playerSockets.left)) ||
				!(await this.isSocketConnected(playerSockets.right))
			) {
				clearInterval(intervalId);
				await this.gameEnd(gameDto);
			}
		}, 4000); // 1000 / 60
	}

	async gameEnd(gameDto: GameDto) {
		/* TODO: game DB update, ladderScore 계산하기 */

		// game DB update
		const updateGameResultPlayerLeftParamDto = {};

		if (gameDto.gameType === GameType.LADDER) {
			// ladderScore 계산하기
			const playerLeft = await this.usersRepository.findOne({
				where: { id: gameDto.playerLeftId },
			});
			const playerRight = await this.usersRepository.findOne({
				where: { id: gameDto.playerRightId },
			});
			if (!playerLeft || !playerRight)
				throw WSBadRequestException(
					`player 의 데이터를 찾지 못했습니다`,
				);

			/* TODO: user db update
		    -> ladderMaxScore 비교 후 반영, Ladder전일 때는 winCount, loseCount도 update */
			// user DB update
		}

		// gameDto 유저들 지워주기
		this.userIdToGameId.delete(gameDto.playerLeftId);
		this.userIdToGameId.delete(gameDto.playerRightId);
		// gameDto 지워주기
		this.gameIdToGameDto.delete(gameDto.getGameId());

		// TODO: leave room
	}

	gameRestart(gameDto: GameDto) {
		gameDto.viewMap.init();
	}

	private checkPlayerSockets(gameDto: GameDto) {
		const playerLeftId = gameDto.playerLeftId;
		const playerRightId = gameDto.playerRightId;

		const playerLeftSocket = this.userIdToClient.get(playerLeftId);
		const playerRightSocket = this.userIdToClient.get(playerRightId);
		if (!playerLeftSocket || !playerRightSocket)
			throw WSBadRequestException(
				`두 플레이어의 게임 소켓이 모두 필요합니다. 게임 불가`,
			);
		console.log(`left player socketId: ${playerLeftSocket.id}`);
		console.log(`right player socketId: ${playerRightSocket.id}`);
		return {
			left: playerLeftSocket,
			right: playerRightSocket,
		};
	}

	private async isSocketConnected(client: Socket) {
		const socket = (await this.server.fetchSockets()).find(
			(s) => s.id === client.id,
		);
		if (!socket) {
			return null;
		}
		return socket;
	}

	// 적절한 조치인지 모르겠다 !
	private async checkGameDto(
		userId: number,
		receivedGameId: number,
	): Promise<GameDto> {
		const gameId = this.userIdToGameId.get(userId);
		if (!gameId) {
			throw WSBadRequestException(
				`user id ${userId} 에게서 game id ${receivedGameId} 를 찾지 못했습니다`,
			);
		}
		if (gameId !== receivedGameId) {
			throw WSBadRequestException(
				`user id ${userId} 의 game id ${gameId} 와 요청된 game id ${receivedGameId} 가 다릅니다`,
			);
		}

		const gameDto = this.gameIdToGameDto.get(gameId);
		if (!gameDto) {
			throw WSBadRequestException(
				`game id ${receivedGameId} 에게서 game 객체를 찾지 못했습니다`,
			);
		} else {
			if (gameDto.gameInterrupted)
				throw WSBadRequestException(
					`game id ${gameId} 는 비정상 종료된 게임입니다`,
				);
		}

		return gameDto;
	}

	delay(ms: number) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(`Delay complete after ${ms} milliseconds`);
			}, ms);
		});
	}
}
