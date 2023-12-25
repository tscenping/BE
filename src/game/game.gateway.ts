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
	EVENT_ERROR,
	EVENT_GAME_INVITATION,
	EVENT_GAME_INVITATION_REPLY,
	EVENT_GAME_MATCHED,
	EVENT_GAME_START,
	EVENT_MATCH_SCORE,
	EVENT_MATCH_STATUS,
	EVENT_SERVER_GAME_READY,
} from '../common/events';
import { ChannelsGateway } from '../channels/channels.gateway';
import { EmitEventInvitationReplyDto } from './dto/emit-event-invitation-reply.dto';
import { GameRepository } from './game.repository';
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
import { UpdateGameResultParamDto } from './dto/update-game-result-param.dto';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { K } from '../common/constants';
import { UpdateDto } from './dto/view-map.dto';
import { User } from '../users/entities/user.entity';

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
		@InjectRedis() private readonly redis: Redis,
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

		console.log(`${user.id} is disconnected to game socket {${client.id}}`);

		await this.usersRepository.update(user.id, {
			gameSocketId: null,
		});

		const gameId = this.userIdToGameId.get(user.id);
		if (gameId) {
			const gameDto = this.gameIdToGameDto.get(gameId);
			if (gameDto) {
				if (
					gameDto.gameStatus === GameStatus.PLAYING &&
					!gameDto.gameInterrupted
				) {
					gameDto.gameInterrupted = true;
				} else {
					// FINISHED는 정상 종료이기 때문에 이미 gameIdTogameDto map에 없다
					await this.gameRepository.softDelete(gameDto.getGameId());
					console.log('game 지워버렸어');
					this.gameIdToGameDto.delete(gameId);
				}
			}
			this.userIdToGameId.delete(user.id);
		}
		this.userIdToClient.delete(user.id);
	}

	@SubscribeMessage('gameRequest')
	async prepareGame(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { gameId: number },
	) {
		console.log('gameRequest 이벤트 받았다 !!!');
		/* TODO: Game 세팅
		 *	1. game Data 만들기
		 *
		 * 	2. map 준비하기 ✅
		 * 	3. game room join하기 ❎ -> 안해도 될듯
		 * 	4. INGAME으로 상태 바꾸기 ✅
		 * 	5. game start event emit ✅*/
		const user = await this.authService.getUserFromSocket(client);
		if (!user) return client.disconnect();
		console.log(`user ${user.id} 가 게임 준비를 요청했습니다`);

		const game = await this.gameRepository.findOne({
			where: { id: data.gameId },
		});
		if (!game) return client.disconnect();

		console.log(`game ${game.id} 이 준비되었습니다`);

		console.log(`data.gameId: ${data.gameId}`);
		let gameDto = this.gameIdToGameDto.get(data.gameId);
		if (!gameDto) {
			gameDto = new GameDto(game);
			this.gameIdToGameDto.set(game.id, gameDto);
			this.userIdToGameId.set(user.id, gameDto.getGameId());
		}
		this.userIdToGameId.set(user.id, gameDto.getGameId());

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
		if (!rival) {
			// client.disconnect();
			return this.sendError(
				client,
				400,
				`상대 player ${rivalId} 의 데이터를 찾지 못했습니다`,
			);
		}

		this.sendServerGameReady(gameDto, rival, client);
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

		const gameDto = await this.checkGameDto(user.id, data.gameId);
		if (!gameDto) {
			// client.disconnect();
			return this.sendError(client, 400, `유효하지 않은 게임입니다`);
		}

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
		console.log('clientGameReady 이벤트 받았다 !!!');
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
		if (!gameDto) {
			// client.disconnect();
			return this.sendError(client, 400, `유효하지 않은 게임입니다`);
		}

		// 유효성 검사
		const playerSockets = this.getPlayerSockets(gameDto);
		if (playerSockets.length !== 2) {
			// client.disconnect();
			return this.sendError(
				client,
				400,
				`두 플레이어의 게임 소켓이 모두 필요합니다. 게임 불가`,
			);
		}

		gameDto.readyCnt++;
		console.log(`ready count: ${gameDto.readyCnt}`);
		if (gameDto.bothReady()) {
			console.log(`It's ready!`);
			gameDto.gameStatus = GameStatus.PLAYING;

			// 이거 꼭 필요할까
			await this.gameRepository.update(gameDto.getGameId(), {
				gameStatus: GameStatus.PLAYING,
			});

			console.log('gameStart 이벤트 보낸다 !!!');
			this.server.to(playerSockets[0].id).emit(EVENT_GAME_START);
			this.server.to(playerSockets[1].id).emit(EVENT_GAME_START);
		} else return;

		await this.delay(1000 * 3);
		// TODO: game restart 될 때도 3초 지연 ? how
		this.gameLoop(gameDto);
	}

	// 테스트에만 쓰임
	@SubscribeMessage('testSetScore')
	async testSetScore(
		@ConnectedSocket() client: Socket,
		@MessageBody()
		data: {
			gameId: number;
			scoreLeft: number;
			scoreRight: number;
		},
	) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user) return client.disconnect;

		const gameDto = await this.checkGameDto(user.id, data.gameId);
		if (!gameDto) {
			// client.disconnect();
			return this.sendError(client, 400, `유효하지 않은 게임입니다`);
		}

		await gameDto.testSetScore(data.scoreLeft, data.scoreRight);
	}

	gameLoop(gameDto: GameDto) {
		console.log('Game Loop started!');
		const playerSockets = this.getPlayerSockets(gameDto);
		if (playerSockets.length !== 2) {
			return this.sendErrorAll(
				playerSockets,
				400,
				`두 플레이어의 게임 소켓이 모두 필요합니다. 게임 불가`,
			);
		}

		let cnt = 0;
		const intervalId: NodeJS.Timeout = setInterval(async () => {
			cnt++;
			const viewMap = gameDto.viewMap;

			// update objects
			const updateDto = await viewMap.changes();
			console.log('\n');
			console.log(`----${cnt}'번째 loop에서의 오브젝트들----`);
			console.log('racket status:');
			console.log(`	left racket y: ${gameDto.viewMap.racketLeft.y}`);
			console.log(`	right racket y: ${gameDto.viewMap.racketRight.y}`);
			console.log('ball status:');
			console.log(`	x: ${gameDto.viewMap.ball.x}`);
			console.log(`	y: ${gameDto.viewMap.ball.y}`);
			console.log('ball velocity status:');
			console.log(`	x: ${gameDto.viewMap.ball.xVelocity}`);
			console.log(`	y: ${gameDto.viewMap.ball.yVelocity}`);
			console.log('\n');

			// emit update objects to each user
			this.sendMatchStatus(updateDto, playerSockets);

			// update score
			if (updateDto.isScoreChanged()) {
				if (updateDto.scoreLeft) gameDto.scoreLeft++;
				else if (updateDto.scoreRight) gameDto.scoreRight++;

				//emit score to each user
				this.sendMatchScore(gameDto, playerSockets);

				// end or restart
				if (gameDto.isOver()) {
					clearInterval(intervalId);
					await this.gameEnd(gameDto);
				} else if (
					!gameDto.gameInterrupted &&
					this.getPlayerSockets(gameDto).length === 2
				) {
					await this.delay(1000 * 3);
					await gameDto.restart();
				}
			}

			// check interrupted by disconnected user
			if (
				gameDto.gameInterrupted ||
				this.getPlayerSockets(gameDto).length !== 2
			) {
				console.log('으악 게임이 강제로 중단됐다');
				clearInterval(intervalId);
				const playerSockets = this.getPlayerSockets(gameDto);
				return this.sendErrorAll(
					playerSockets,
					400,
					`비정상 종료로 게임이 무효화되었습니다`,
				);
			}
		}, 1000 / 10); // 테스트시엔 4초, 원래는 1/60초 (1000 / 60)
	}

	async gameEnd(gameDto: GameDto) {
		await gameDto.setResult();

		if (
			!gameDto.winnerId ||
			!gameDto.loserId ||
			gameDto.winnerScore === 0 ||
			gameDto.loserScore === 0
		) {
			const playerSockets = this.getPlayerSockets(gameDto);
			return this.sendErrorAll(
				playerSockets,
				400,
				`비정상 종료로 게임이 무효화되었습니다`,
			);
		}
		// game DB 업데이트
		const updateGameResultParamDto: UpdateGameResultParamDto = {
			winnerId: gameDto.winnerId as number,
			loserId: gameDto.loserId as number,
			winnerScore: gameDto.winnerScore,
			loserScore: gameDto.loserScore,
			gameStatus: GameStatus.FINISHED,
		};

		await this.gameRepository.update(
			gameDto.getGameId(),
			updateGameResultParamDto,
		);

		// ladderScore 계산, user DB 업데이트
		if (gameDto.gameType === GameType.LADDER) {
			const winner = await this.usersRepository.findOne({
				where: { id: gameDto.winnerId },
			});
			const loser = await this.usersRepository.findOne({
				where: { id: gameDto.loserId },
			});
			if (!winner || !loser) {
				const playerSockets = this.getPlayerSockets(gameDto);
				return this.sendErrorAll(
					playerSockets,
					400,
					`player 의 데이터를 찾지 못했습니다`,
				);
			}

			await this.updateLadderData(winner, loser);
		}
		// gameDto 유저들 지워주기
		this.userIdToGameId.delete(gameDto.playerLeftId);
		this.userIdToGameId.delete(gameDto.playerRightId);
		// gameDto 지워주기
		this.gameIdToGameDto.delete(gameDto.getGameId());
	}

	private async updateLadderData(winner: User, loser: User) {
		// winner가 이겼을 가능성
		const winnerWinProb = this.probability(
			loser.ladderScore,
			winner.ladderScore,
		);
		// loser가 이겼을 가능성
		const loserWinProb = this.probability(
			winner.ladderScore,
			loser.ladderScore,
		);

		const winnerNewLadderScore =
			winner.ladderScore + K * (1 - winnerWinProb);
		const loserNewLadderScore = loser.ladderScore + K * (0 - loserWinProb);
		console.log(
			`winner's score change: before ${winner.ladderScore} -> after ${winnerNewLadderScore}`,
		);
		console.log(
			`loser's score change: before ${loser.ladderScore} -> after ${loserNewLadderScore}`,
		);

		await this.usersRepository.update(winner.id, {
			ladderScore: winnerNewLadderScore,
			ladderMaxScore:
				winnerNewLadderScore > winner.ladderScore
					? winnerNewLadderScore
					: winner.ladderScore,
			winCount: winner.winCount + 1,
		});
		await this.usersRepository.update(loser.id, {
			ladderScore: loserNewLadderScore,
			ladderMaxScore:
				loserNewLadderScore > loser.ladderScore
					? loserNewLadderScore
					: loser.ladderScore,
			loseCount: loser.loseCount + 1,
		});
	}

	private probability(rating1: number, rating2: number) {
		return 1.0 / (1.0 + Math.pow(10, (rating1 - rating2) / 400));
	}

	private getPlayerSockets(gameDto: GameDto) {
		const sockets = [];
		const playerLeftId = gameDto.playerLeftId;
		const playerRightId = gameDto.playerRightId;

		const playerLeftSocket = this.userIdToClient.get(playerLeftId);
		const playerRightSocket = this.userIdToClient.get(playerRightId);

		if (playerLeftSocket) {
			sockets.push(playerLeftSocket);
		}

		if (playerRightSocket) {
			sockets.push(playerRightSocket);
		}

		return sockets;
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

	private async checkGameDto(userId: number, receivedGameId: number) {
		const gameId = this.userIdToGameId.get(userId);
		if (!gameId) return null;
		if (gameId !== receivedGameId) return null;

		const gameDto = this.gameIdToGameDto.get(gameId);
		if (!gameDto) {
			return null;
		} else {
			if (gameDto.gameInterrupted) return null;
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

	sendGameInvitation(
		gatewayInvitationParamDto: GatewayCreateGameInvitationParamDto,
	) {
		const invitedUserChannelSocketId =
			gatewayInvitationParamDto.invitedUserChannelSocketId;
		const invitationId = gatewayInvitationParamDto.invitationId;
		const invitingUserNickname =
			gatewayInvitationParamDto.invitingUserNickname;
		const gameType = gatewayInvitationParamDto.gameType;

		console.log(
			`소켓 id ${invitedUserChannelSocketId} 에 gameInvitation 이벤트 보낸다 !!!`,
		);
		this.channelsGateway.server
			.to(invitedUserChannelSocketId)
			.emit(EVENT_GAME_INVITATION, {
				invitationId: invitationId,
				invitingUserNickname: invitingUserNickname,
				gameType: gameType,
			});
	}

	sendInvitationReply(sendInvitationReplyDto: EmitEventInvitationReplyDto) {
		const targetUserChannelSocketId =
			sendInvitationReplyDto.targetUserChannelSocketId;
		const isAccepted = sendInvitationReplyDto.isAccepted;
		const gameId = sendInvitationReplyDto.gameId;

		console.log(
			`소켓 id ${targetUserChannelSocketId} 에 gameInvitationReply 이벤트 보낸다 !!!`,
		);
		this.channelsGateway.server
			.to(targetUserChannelSocketId)
			.emit(EVENT_GAME_INVITATION_REPLY, {
				isAccepted: isAccepted,
				gameId: gameId,
			});
	}

	sendMatchmakingReply(
		sendMatchmakingReplyDto: EmitEventMatchmakingReplyDto,
	) {
		const targetUserChannelSocketId =
			sendMatchmakingReplyDto.targetUserChannelSocketId;
		const gameId = sendMatchmakingReplyDto.gameId;

		console.log(
			`소켓 id ${targetUserChannelSocketId} 에 gameMatched 이벤트 보낸다 !!!`,
		);
		this.channelsGateway.server
			.to(targetUserChannelSocketId)
			.emit(EVENT_GAME_MATCHED, {
				gameId: gameId,
			});
	}

	sendServerGameReady(gameDto: GameDto, rival: User, client: Socket) {
		console.log('serverGameReady 이벤트 보낸다 !!!');
		const viewMap = gameDto.viewMap;
		const amILeft = rival.id === gameDto.playerRightId;

		const myPosition = amILeft ? 'LEFT' : 'RIGHT';
		const myRacketX = amILeft ? viewMap.racketLeftX : viewMap.racketRightX;
		const rivalRacketX = amILeft
			? viewMap.racketRightX
			: viewMap.racketLeftX;
		const myRacketY = amILeft
			? viewMap.racketLeft.y
			: viewMap.racketRight.y;
		const rivalRacketY = amILeft
			? viewMap.racketRight.y
			: viewMap.racketLeft.y;
		const racketHeight = viewMap.racketHeight;
		const racketWidth = viewMap.racketWidth;

		const eventServerGameReadyParamDto: EmitEventServerGameReadyParamDto = {
			rivalNickname: rival.nickname,
			rivalAvatar: rival.avatar,
			myPosition,
			ball: {
				x: viewMap.ball.x,
				y: viewMap.ball.y,
				radius: viewMap.ballRadius,
			},
			myRacket: {
				x: myRacketX,
				y: myRacketY,
				height: racketHeight,
				width: racketWidth,
			},
			rivalRacket: {
				x: rivalRacketX,
				y: rivalRacketY,
				height: racketHeight,
				width: racketWidth,
			},
		};

		this.server
			.to(client.id)
			.emit(EVENT_SERVER_GAME_READY, eventServerGameReadyParamDto);
	}

	sendMatchStatus(updateDto: UpdateDto, playerSockets: Socket[]) {
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
			.to(playerSockets[0].id)
			.emit(EVENT_MATCH_STATUS, playerLeftMatchStatusDto);
		this.server
			.to(playerSockets[1].id)
			.emit(EVENT_MATCH_STATUS, playerRightMatchStatusDto);
	}

	sendMatchScore(gameDto: GameDto, playerSockets: Socket[]) {
		const playerLeftMatchScoreDto: EmitEventMatchScoreParamDto = {
			myScore: gameDto.scoreLeft,
			rivalScore: gameDto.scoreRight,
		};
		const playerRightMatchScoreDto: EmitEventMatchScoreParamDto = {
			myScore: gameDto.scoreRight,
			rivalScore: gameDto.scoreLeft,
		};
		this.server
			.to(playerSockets[0].id)
			.emit(EVENT_MATCH_SCORE, playerLeftMatchScoreDto);
		this.server
			.to(playerSockets[1].id)
			.emit(EVENT_MATCH_SCORE, playerRightMatchScoreDto);
	}

	sendError(client: Socket, statusCode: number, message: string) {
		this.server.to(client.id).emit(EVENT_ERROR, {
			statusCode: statusCode,
			message: message,
		});
	}

	sendErrorAll(clients: Socket[], statusCode: number, message: string) {
		if (clients.length === 0) return;
		clients.forEach((client) => {
			// client.disconnect();
			this.server.to(client.id).emit(EVENT_ERROR, {
				statusCode: statusCode,
				message: message,
			});
		});
	}
}
