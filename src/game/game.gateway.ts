import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { UsersRepository } from '../user-repository/users.repository';
import { FriendsRepository } from '../friends/friends.repository';
import { Server, Socket } from 'socket.io';
import {
	UseFilters,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { WsFilter } from '../common/exception/custom-ws-exception.filter';
import { GatewayCreateGameInvitationParamDto } from './dto/gateway-create-invitation-param.dto';
import {
	EVENT_ERROR,
	EVENT_GAME_INVITATION,
	EVENT_GAME_INVITATION_REPLY,
	EVENT_GAME_MATCHED,
	EVENT_GAME_START,
	EVENT_MATCH_END,
	EVENT_MATCH_SCORE,
	EVENT_MATCH_STATUS,
	EVENT_SERVER_GAME_READY,
	EVENT_USER_STATUS,
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
import { User } from '../user-repository/entities/user.entity';
import { EmitEventMatchEndParamDto } from './dto/emit-event-match-end-param.dto';
import { WsAuthGuard } from '../common/guards/ws-auth.guard';
import { SocketWithAuth } from '../common/adapter/socket-io.adapter';
import { WSBadRequestException } from '../common/exception/custom-exception';

@WebSocketGateway({ namespace: 'game' })
@UseGuards(WsAuthGuard)
@UseFilters(WsFilter)
@UsePipes(ValidationPipe)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
	private userIdToClient: Map<number, Socket>;
	private userIdToGameId: Map<number, number>;
	private gameIdToGameDto: Map<number, GameDto>;

	constructor(
		private readonly usersRepository: UsersRepository,
		private readonly friendsRepository: FriendsRepository,
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

	async handleConnection(@ConnectedSocket() client: SocketWithAuth) {
		const user = client.user;
		if (!user || !client.id) return client.disconnect();
		else if (user.gameSocketId) {
			console.log('game socket 갈아끼운다 ~?!');
			const socket = this.userIdToClient.get(user.id);
			if (socket) {
				const result = await this.isSocketConnected(socket);
				if (result) socket.disconnect();
				else this.userIdToClient.delete(user.id);
			} else {
				await this.usersRepository.update(user.id, {
					gameSocketId: null,
					status: UserStatus.ONLINE,
				});
			}
		}

		console.log(
			`${user.id}, ${user.nickname} is connected to game socket {${client.id}}`,
		);

		// 연결된 게임소켓 id를 저장한다.
		await this.usersRepository.update(user.id, {
			gameSocketId: client.id,
		});
		this.userIdToClient.set(user.id, client);
	}

	async handleDisconnect(@ConnectedSocket() client: SocketWithAuth) {
		// 끊기고 실행되는 로직. .
		const user = client.user;
		if (!user || !client.id) return;

		console.log(
			`${user.id}, ${user.nickname} is disconnected to game socket {${client.id}}`,
		);

		await this.usersRepository.update(user.id, {
			gameSocketId: null,
			status: UserStatus.ONLINE,
		});

		const gameId = this.userIdToGameId.get(user.id);
		if (gameId) {
			const gameDto = this.gameIdToGameDto.get(gameId);
			if (gameDto) {
				if (
					gameDto.gameStatus === GameStatus.PLAYING &&
					!gameDto.interrupted
				) {
					gameDto.interrupted = true;
					gameDto.loserId = user.id;
				} else if (gameDto.gameStatus === GameStatus.WAITING) {
					await gameDto.setNone();
					const playerSockets = await this.getPlayerSockets(gameDto);
					/* game update */
					// 지우기 전에 예쁜 데이터 만들기.. 필요할까?
					await this.gameRepositoryUpdate(gameDto);

					/* game 지우기 */
					await this.gameRepository.softDelete(gameDto.getGameId());

					/* unmapping */
					await this.deleteMapData(gameDto);

					const left = await this.usersRepository.findOne({
						where: { id: gameDto.playerLeftId },
					});
					const right = await this.usersRepository.findOne({
						where: { id: gameDto.playerRightId },
					});
					if (!left || !right) {
						// return this.sendErrorAll(
						// 	playerSockets,
						// 	`player 의 데이터를 찾지 못했습니다`,
						// );
						throw WSBadRequestException(
							`player 의 데이터를 찾지 못했습니다`,
						);
					}

					/* emit */
					this.sendMatchEnd(playerSockets, gameDto, left, right);

					/* disconnect */
					await this.disconnectSockets(playerSockets);
				}
			}
		}
		this.userIdToClient.delete(user.id);

		const friendChannelSocketIdList =
			await this.friendsRepository.findAllFriendChannelSocketIdByUserId(
				user.id,
			);

		const eventUserStatusEmitDto = {
			userId: user.id,
			status: UserStatus.ONLINE,
		};

		for (const friendChannelSocketId of friendChannelSocketIdList) {
			this.channelsGateway.server
				.to(friendChannelSocketId.channelSocketId)
				.emit(EVENT_USER_STATUS, eventUserStatusEmitDto);
		}
	}

	@SubscribeMessage('gameRequest')
	async prepareGame(
		@ConnectedSocket() client: SocketWithAuth,
		@MessageBody() data: { gameId: number },
	) {
		console.log('gameRequest 이벤트 받았다 !!!');
		/* TODO: Game 세팅
		    1. game Data 만들기
		    2. map 준비하기 ✅
		   	3. game room join하기 ❎
		   	4. INGAME으로 상태 바꾸기 ✅
		   	5. game start event emit ✅
		 * */
		const user = client.user;
		if (!user) return client.disconnect();
		console.log(`user ${user.id} 가 게임 준비를 요청했습니다`);

		const game = await this.gameRepository.findOne({
			where: { id: data.gameId },
		});
		if (!game) {
			console.log(`해당 game ${data.gameId} 이 없어서 disconnect 된다`);
			return client.disconnect();
		}
		if (game.gameStatus !== GameStatus.WAITING) {
			console.log(
				`해당 game ${data.gameId} 이 WAITING 상태가 아니어서 disconnect 된다`,
			);
			return client.disconnect();
		}

		let gameDto = this.gameIdToGameDto.get(data.gameId);
		if (!gameDto) {
			gameDto = new GameDto(game);
			this.gameIdToGameDto.set(game.id, gameDto);
			this.userIdToGameId.set(user.id, gameDto.getGameId());
		}
		this.userIdToGameId.set(user.id, gameDto.getGameId());

		console.log(`game id ${game.id} 이 성공적으로 준비되었습니다`);

		// 4. INGAME으로 상태 바꾸고 친구들한테 보내기
		await this.usersRepository.update(user.id, {
			status: UserStatus.INGAME,
		});

		const friendChannelSocketIdList =
			await this.friendsRepository.findAllFriendChannelSocketIdByUserId(
				user.id,
			);

		const eventUserStatusEmitDto = {
			userId: user.id,
			status: UserStatus.INGAME,
		};

		for (const friendChannelSocketId of friendChannelSocketIdList) {
			this.channelsGateway.server
				.to(friendChannelSocketId.channelSocketId)
				.emit(EVENT_USER_STATUS, eventUserStatusEmitDto);
		}

		// rival 정보 보내기
		const rivalId =
			user.id === gameDto.playerRightId
				? gameDto.playerLeftId
				: gameDto.playerRightId;

		const rival = await this.usersRepository.findOne({
			where: { id: rivalId },
		});
		if (!rival)
			throw WSBadRequestException(
				`상대 player ${rivalId} 의 데이터를 찾지 못했습니다`,
			);

		this.sendServerGameReady(client, gameDto, rival);
	}

	@SubscribeMessage('matchKeyDown')
	async updateBallAndRacket(
		@ConnectedSocket() client: SocketWithAuth,
		@MessageBody()
		data: {
			gameId: number;
			keyStatus: KEYSTATUS;
			keyName: KEYNAME;
		},
	) {
		const user = client.user;
		if (!user) return client.disconnect();

		const gameDto = await this.checkGameDto(user.id, data.gameId);
		if (!gameDto) {
			throw WSBadRequestException(`유효하지 않은 게임입니다`);
		}

		// console.log('----When matchKeyDown event coming, racket status----');
		// console.log(`before left racket y: ${gameDto.viewMap.racketLeft.y}`);
		// console.log(`before right racket y: ${gameDto.viewMap.racketRight.y}`);
		if (data.keyStatus === KEYSTATUS.down) {
			// console.log('hi im gonna update racket');
			if (user.id === gameDto.playerLeftId)
				gameDto.viewMap.updateRacketLeft(data.keyName);
			else gameDto.viewMap.updateRacketRight(data.keyName);
		}
		// console.log(`after left racket y: ${gameDto.viewMap.racketLeft.y}`);
		// console.log(`after right racket y: ${gameDto.viewMap.racketRight.y}`);
	}

	@SubscribeMessage('clientGameReady')
	async gaming(
		@ConnectedSocket() client: SocketWithAuth,
		@MessageBody() data: { gameId: number },
	) {
		console.log('clientGameReady 이벤트 받았다 !!!');
		/* TODO: gameLoop
		    1. ball racket update, emit
		    2. score update, emit -> restart
		    3. 둘 중 하나 끊겼는지 확인하고 승패 처리 -> gameEnd(game DB 저장, user DB 저장, userIdToGameId에서 gameId을 지우기)
		    4. max score인지 확인 -> gameEnd(game DB 저장, user DB 저장, userIdToGameId에서 gameId을 지우기)
		    5. init하기
		 * */
		// auth guard
		const user = client.user;
		if (!user) return client.disconnect;

		console.log(`--------${client.id} is ready--------`);

		const gameDto = await this.checkGameDto(user.id, data.gameId);
		if (!gameDto) throw WSBadRequestException(`유효하지 않은 게임입니다`);

		const playerSockets = await this.getPlayerSockets(gameDto);
		if (!playerSockets.left || !playerSockets.right)
			throw WSBadRequestException(
				`두 플레이어의 게임 소켓이 모두 필요합니다. 게임 불가`,
			);

		gameDto.readyCnt++;
		console.log(`ready count: ${gameDto.readyCnt}`);
		if (gameDto.bothReady()) {
			console.log(`It's ready!`);
			gameDto.gameStatus = GameStatus.PLAYING;

			await this.gameRepository.update(gameDto.getGameId(), {
				gameStatus: GameStatus.PLAYING,
			});

			await this.delay(1000 * 3);
			console.log('gameStart 이벤트 보낸다 !!!');
			this.server.to(playerSockets.left.id).emit(EVENT_GAME_START);
			this.server.to(playerSockets.right.id).emit(EVENT_GAME_START);
		} else return;

		await this.gameLoop(gameDto);
	}

	async gameLoop(gameDto: GameDto) {
		console.log('Game Loop started!');
		let playerSockets = await this.getPlayerSockets(gameDto);

		// let cnt = 0;
		const intervalId: NodeJS.Timeout = setInterval(async () => {
			// cnt++;
			const viewMap = gameDto.viewMap;

			// update objects
			const updateDto = await viewMap.changes();
			// console.log('\n');
			// console.log(`----${cnt}'번째 loop에서의 오브젝트들----`);
			// console.log('racket status:');
			// console.log(`	left racket y: ${gameDto.viewMap.racketLeft.y}`);
			// console.log(`	right racket y: ${gameDto.viewMap.racketRight.y}`);
			// console.log('ball status:');
			// console.log(`	x: ${gameDto.viewMap.ball.x}`);
			// console.log(`	y: ${gameDto.viewMap.ball.y}`);
			// console.log('ball velocity status:');
			// console.log(`	x: ${gameDto.viewMap.ball.xVelocity}`);
			// console.log(`	y: ${gameDto.viewMap.ball.yVelocity}`);
			// console.log('\n');

			// emit update objects to each user
			this.sendMatchStatus(playerSockets, updateDto);

			// update score
			if (updateDto.isScoreChanged()) {
				if (updateDto.scoreLeft) gameDto.scoreLeft++;
				else if (updateDto.scoreRight) gameDto.scoreRight++;

				//emit score to each user
				this.sendMatchScore(playerSockets, gameDto);

				// end or restart
				if (gameDto.isOver()) {
					clearInterval(intervalId);
					await this.gameEnd(gameDto);
					return;
				} else if (!gameDto.interrupted) {
					playerSockets = await this.getPlayerSockets(gameDto);
					if (playerSockets.left && playerSockets.right) {
						// await this.delay(1000 * 3); // 안먹어요
						await gameDto.restart();
						return;
					}
				}
			}

			// check interrupted by disconnected user
			if (gameDto.interrupted) {
				console.log('으악 게임이 강제로 중단됐다');
				clearInterval(intervalId);
				await this.gameInterrupted(gameDto);
			}
		}, 1000 / 60);
	}

	async gameInterrupted(gameDto: GameDto) {
		const playerSockets = await this.getPlayerSockets(gameDto);

		await gameDto.setGameInterrupted();

		/* game update */
		await this.gameRepositoryUpdate(gameDto);

		/* unmapping */
		await this.deleteMapData(gameDto);

		const left = await this.usersRepository.findOne({
			where: { id: gameDto.playerLeftId },
		});
		const right = await this.usersRepository.findOne({
			where: { id: gameDto.playerRightId },
		});
		if (!left || !right) {
			// return this.sendErrorAll(
			// 	playerSockets,
			// 	`player 의 데이터를 찾지 못했습니다`,
			// );
			throw WSBadRequestException(`player 의 데이터를 찾지 못했습니다`);
		}

		/* user update */
		if (gameDto.gameType === GameType.LADDER) {
			const winner = gameDto.winnerId === left.id ? left : right;
			const loser = gameDto.loserId === left.id ? left : right;
			await this.updateLadderData(winner, loser);
		}
		/* emit */
		this.sendMatchEnd(playerSockets, gameDto, left, right);

		/* disconnect */
		await this.disconnectSockets(playerSockets);
	}

	async gameEnd(gameDto: GameDto) {
		const playerSockets = await this.getPlayerSockets(gameDto);

		await gameDto.setGameOver();

		/* game update */
		await this.gameRepositoryUpdate(gameDto);

		/* unmapping */
		await this.deleteMapData(gameDto);

		const left = await this.usersRepository.findOne({
			where: { id: gameDto.playerLeftId },
		});
		const right = await this.usersRepository.findOne({
			where: { id: gameDto.playerRightId },
		});
		if (!left || !right) {
			// return this.sendErrorAll(
			// 	playerSockets,
			// 	`player 의 데이터를 찾지 못했습니다`,
			// );
			throw WSBadRequestException(`player 의 데이터를 찾지 못했습니다`);
		}

		/* user update */
		if (gameDto.gameType === GameType.LADDER) {
			const winner = gameDto.winnerId === left.id ? left : right;
			const loser = gameDto.loserId === left.id ? left : right;
			await this.updateLadderData(winner, loser);
		}
		/* emit */
		this.sendMatchEnd(playerSockets, gameDto, left, right);

		/* disconnect */
		await this.disconnectSockets(playerSockets);
	}

	private async gameRepositoryUpdate(gameDto: GameDto) {
		const updateGameResultParamDto: UpdateGameResultParamDto = {
			winnerId: gameDto.winnerId as number,
			loserId: gameDto.loserId as number,
			winnerScore: gameDto.winnerScore,
			loserScore: gameDto.loserScore,
			gameType: gameDto.gameType,
			gameStatus: GameStatus.FINISHED,
		};

		await this.gameRepository.update(
			gameDto.getGameId(),
			updateGameResultParamDto,
		);
	}

	private async deleteMapData(gameDto: GameDto) {
		// gameDto 유저들 지워주기
		this.userIdToGameId.delete(gameDto.playerLeftId);
		// console.log(
		// 	`${gameDto.playerLeftId} 를 userId-gameId 맵에서 지웁니다 ?!!`,
		// );
		this.userIdToGameId.delete(gameDto.playerRightId);
		// console.log(
		// 	`${gameDto.playerRightId} 를 userId-gameId 맵에서 지웁니다 ?!!`,
		// );

		// gameDto 지워주기
		this.gameIdToGameDto.delete(gameDto.getGameId());
		// console.log(
		// 	`${gameDto.getGameId()} 를 gameId-gameDto 맵에서 지웁니다 ?!!`,
		// );
	}

	private async disconnectSockets(playerSockets: {
		left: Socket | null;
		right: Socket | null;
	}) {
		playerSockets.left?.disconnect();
		// if (playerSockets.left)
		// 	console.log(
		// 		`${playerSockets.left} 를 gameId-gameDto 맵에서 지웁니다 ?!!`,
		// 	);
		// else console.log(`playerSockets.left가 없음`);
		playerSockets.right?.disconnect();
		// if (playerSockets.right)
		// 	console.log(
		// 		`${playerSockets.right} 를 gameId-gameDto 맵에서 지웁니다 ?!!`,
		// 	);
		// else console.log(`playerSockets.right가 없음`);
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

		const winnerNewLadderScore = Math.round(
			winner.ladderScore + K * (1 - winnerWinProb),
		);
		const loserNewLadderScore = Math.round(
			loser.ladderScore + K * (0 - loserWinProb),
		);
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

	private async getPlayerSockets(gameDto: GameDto) {
		const sockets = {
			left: null as Socket | null,
			right: null as Socket | null,
		};
		const playerLeftId = gameDto.playerLeftId;
		const playerRightId = gameDto.playerRightId;

		const playerLeftSocket = this.userIdToClient.get(playerLeftId);
		if (
			playerLeftSocket &&
			(await this.isSocketConnected(playerLeftSocket))
		) {
			sockets.left = playerLeftSocket;
		} else {
			sockets.left = null;
		}
		const playerRightSocket = this.userIdToClient.get(playerRightId);
		if (
			playerRightSocket &&
			(await this.isSocketConnected(playerRightSocket))
		) {
			sockets.right = playerRightSocket;
		} else {
			sockets.right = null;
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
			if (gameDto.interrupted) return null;
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

	sendServerGameReady(client: Socket, gameDto: GameDto, rival: User) {
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

		console.log(`${client.id}에 serverGameReady 이벤트 보낸다 !!!`);
		this.server
			.to(client.id)
			.emit(EVENT_SERVER_GAME_READY, eventServerGameReadyParamDto);
	}

	sendMatchStatus(
		playerSockets: {
			left: Socket | null;
			right: Socket | null;
		},
		updateDto: UpdateDto,
	) {
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
		if (playerSockets.left) {
			this.server
				.to(playerSockets.left.id)
				.emit(EVENT_MATCH_STATUS, playerLeftMatchStatusDto);
		}
		if (playerSockets.right) {
			this.server
				.to(playerSockets.right.id)
				.emit(EVENT_MATCH_STATUS, playerRightMatchStatusDto);
		}
	}

	sendMatchScore(
		playerSockets: {
			left: Socket | null;
			right: Socket | null;
		},
		gameDto: GameDto,
	) {
		const playerLeftMatchScoreDto: EmitEventMatchScoreParamDto = {
			myScore: gameDto.scoreLeft,
			rivalScore: gameDto.scoreRight,
		};
		const playerRightMatchScoreDto: EmitEventMatchScoreParamDto = {
			myScore: gameDto.scoreRight,
			rivalScore: gameDto.scoreLeft,
		};
		if (playerSockets.left) {
			this.server
				.to(playerSockets.left.id)
				.emit(EVENT_MATCH_SCORE, playerLeftMatchScoreDto);
		}
		if (playerSockets.right) {
			this.server
				.to(playerSockets.right.id)
				.emit(EVENT_MATCH_SCORE, playerRightMatchScoreDto);
		}
	}

	sendMatchEnd(
		playerSockets: {
			left: Socket | null;
			right: Socket | null;
		},
		gameDto: GameDto,
		left: User,
		right: User,
	) {
		const leftMatchEndParamDtos: EmitEventMatchEndParamDto = {
			gameType: gameDto.gameType,
			rivalName: right.nickname,
			rivalAvatar: right.avatar,
			rivalScore: gameDto.scoreRight,
			myScore: gameDto.scoreLeft,
			isWin: gameDto.scoreLeft > gameDto.scoreRight,
			myLadderScore:
				gameDto.gameType === GameType.LADDER ? left.ladderScore : null,
			rivalLadderScore:
				gameDto.gameType === GameType.LADDER ? right.ladderScore : null,
		};
		const rightMatchEndParamDtos: EmitEventMatchEndParamDto = {
			gameType: gameDto.gameType,
			rivalName: left.nickname,
			rivalAvatar: left.avatar,
			rivalScore: gameDto.scoreLeft,
			myScore: gameDto.scoreRight,
			isWin: gameDto.scoreRight > gameDto.scoreLeft,
			myLadderScore:
				gameDto.gameType === GameType.LADDER ? right.ladderScore : null,
			rivalLadderScore:
				gameDto.gameType === GameType.LADDER ? left.ladderScore : null,
		};

		if (playerSockets.left) {
			this.server
				.to(playerSockets.left.id)
				.emit(EVENT_MATCH_END, leftMatchEndParamDtos);
			console.log(
				`${playerSockets.left.id}에 matchEnd 이벤트 보냈다 !!!`,
			);
		}
		if (playerSockets.right) {
			this.server
				.to(playerSockets.right.id)
				.emit(EVENT_MATCH_END, rightMatchEndParamDtos);
			console.log(
				`${playerSockets.right.id}에 matchEnd 이벤트 보냈다 !!!`,
			);
		}
	}

	sendErrorAll(
		clients: {
			left: Socket | null;
			right: Socket | null;
		},
		message: string,
	) {
		if (clients.left) {
			this.server
				.to(clients.left.id)
				.emit(EVENT_ERROR, { message: message });
			console.log(
				`${clients.left.id}가 ${message} 이유로 disconnect 된다`,
			);
			clients.left.disconnect();
		}
		if (clients.right) {
			this.server
				.to(clients.right.id)
				.emit(EVENT_ERROR, { message: message });
			console.log(
				`${clients.right.id}가 가 ${message} 이유로 disconnect 된다`,
			);
			clients.right.disconnect();
		}
	}
}
