import { GameStatus, GameType } from '../../common/enum';
import { Game } from '../entities/game.entity';
import { ViewMapDto } from './view-map.dto';

export class GameDto {
	private gameId: number;
	playerLeftId: number;
	playerRightId: number;
	scoreLeft: number;
	scoreRight: number;
	winnerId: number | null;
	loserId: number | null;
	winnerScore: number;
	loserScore: number;
	gameType: GameType;
	gameStatus: GameStatus;
	viewMap: ViewMapDto;
	readyCnt: number;
	interrupted: boolean;

	constructor(game: Game, readonly maxScore = 7) {
		this.setGameId(game.id);
		this.playerLeftId = game.winnerId;
		this.playerRightId = game.loserId;
		this.scoreLeft = game.winnerScore;
		this.scoreRight = game.loserScore;
		this.winnerId = null;
		this.loserId = null;
		this.winnerScore = 0;
		this.loserScore = 0;
		this.gameType = game.gameType;
		this.gameStatus = game.gameStatus;
		this.viewMap = new ViewMapDto(game.ballSpeed, game.racketSize);
		this.readyCnt = 0;
		this.interrupted = false;
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

	async restart() {
		await this.viewMap.initObjects();
	}

	async setGameOver() {
		if (this.scoreLeft === this.maxScore) {
			this.winnerScore = this.scoreLeft;
			this.winnerId = this.playerLeftId;
			this.loserScore = this.scoreRight;
			this.loserId = this.playerRightId;
		} else if (this.scoreRight === this.maxScore) {
			this.winnerScore = this.scoreRight;
			this.winnerId = this.playerRightId;
			this.loserScore = this.scoreLeft;
			this.loserId = this.playerLeftId;
		}
	}

	async setGameInterrupted() {
		// 게임 중에 비정상 종료돼서 몰수패 처리
		if (this.loserId) {
			const isLoserLeft = this.loserId === this.playerLeftId;
			if (isLoserLeft) {
				this.scoreLeft = this.loserScore = 0;
				this.scoreRight = this.winnerScore = this.maxScore;
				this.winnerId = this.playerRightId;
			} else {
				this.scoreRight = this.loserScore = 0;
				this.scoreLeft = this.winnerScore = this.maxScore;
				this.winnerId = this.playerLeftId;
			}
		}
	}

	async setNone() {
		// 게임 시작 전 비정상 종료돼서 게임 자체를 무효 처리
		this.scoreLeft = this.scoreRight = 0;
		this.winnerId = this.playerLeftId;
		this.winnerScore = this.loserScore = 0;
		this.loserId = this.playerRightId;
		this.loserScore = 0;
		this.gameType = GameType.NONE;
		this.gameStatus = GameStatus.FINISHED;
	}

	private setGameId(gameId: number) {
		this.gameId = gameId;
	}

	// 테스트에만 쓰임
	async testSetScore(scoreLeft: number, scoreRight: number) {
		this.scoreLeft = scoreLeft;
		this.scoreRight = scoreRight;
	}
}
