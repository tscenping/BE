import { GameStatus, GameType } from '../../common/enum';
import { Game } from '../entities/game.entity';
import { ViewMapDto } from './view-map.dto';

export class GameDto {
	private gameId: number;
	playerLeftId: number;
	playerRightId: number;
	winnerId: number | null;
	loserId: number | null;
	scoreLeft: number;
	scoreRight: number;
	gameType: GameType;
	gameStatus: GameStatus;
	viewMap: ViewMapDto;
	readyCnt: number;
	gameInterrupted: boolean;

	constructor(game: Game, readonly maxScore = 7) {
		this.setGameId(game.id);
		this.playerLeftId = game.winnerId;
		this.playerRightId = game.loserId;
		this.winnerId = null;
		this.loserId = null;
		this.scoreLeft = game.winnerScore;
		this.scoreRight = game.loserScore;
		this.gameType = game.gameType;
		this.gameStatus = game.gameStatus;
		this.viewMap = new ViewMapDto(game.ballSpeed, game.racketSize);
		this.readyCnt = 0;
		this.gameInterrupted = false;
	}

	getGameId() {
		return this.gameId;
	}

	bothReady() {
		return this.readyCnt == 2;
	}

	isOver(): boolean {
		if (
			this.scoreLeft === this.maxScore ||
			this.scoreRight === this.maxScore
		) {
			this.gameStatus = GameStatus.FINISHED;
			return true;
		}
		return false;
	}

	private setGameId(gameId: number) {
		this.gameId = gameId;
	}
}
