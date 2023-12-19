import { GameStatus, GameType } from '../../common/enum';
import { GameDto } from './game.dto';

export class CreateGameParamDto {
	winnerId: number;
	loserId: number;
	gameType: GameType;
	winnerScore: number;
	loserScore: number;
	gameStatus: GameStatus;
	ballSpeed: number;
	racketSize: number;

	constructor(
		gameDto: GameDto,
		winnerId: number,
		loserId: number,
		winnerScore: number,
		loserScore: number,
		gameStatus: GameStatus,
	) {
		this.winnerId = winnerId;
		this.loserId = loserId;
		this.gameType = gameDto.gameType;
		this.winnerScore = winnerScore;
		this.loserScore = loserScore;
		this.gameStatus = gameStatus;
		this.ballSpeed = gameDto.viewMap.ballSpeed;
		this.racketSize = gameDto.viewMap.racketSize;
	}
}
