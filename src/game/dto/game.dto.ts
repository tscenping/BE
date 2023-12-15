import { GameStatus } from '../../common/enum';
import { Game } from '../entities/game.entity';
import { ViewMapDto } from './view-map.dto';

export class GameDto {
	private gameId: number;
	player1Id: number;
	player2Id: number;
	winnerId: number | null;
	loserId: number | null;
	score1: number;
	score2: number;
	gameStatus: GameStatus;
	viewMap: ViewMapDto;

	constructor(game: Game) {
		this.setGameId(game.id);
		this.player1Id = game.winnerId;
		this.player2Id = game.loserId;
		this.winnerId = null;
		this.loserId = null;
		this.score1 = game.winnerScore;
		this.score2 = game.loserScore;
		this.gameStatus = game.gameStatus;
		this.viewMap = new ViewMapDto(game.ballSpeed, game.racketSize);
	}
	getGameId() {
		return this.gameId;
	}

	private setGameId(gameId: number) {
		this.gameId = gameId;
	}
}
