import { GameStatus, GameType } from '../../common/enum';

export class CreateInitialGameParamDto {
	winnerId: number;
	loserId: number;
	gameType: GameType;
	winnerScore: number;
	loserScore: number;
	gameStatus: GameStatus;
	ballSpeed: number;
	racketSize: number;

	constructor(
		player1Id: number,
		player2Id: number,
		gameType: GameType,
		gameStatus: GameStatus,
	) {
		this.winnerId = player1Id;
		this.loserId = player2Id;
		this.gameType = gameType;
		this.winnerScore = 0;
		this.loserScore = 0;
		this.gameStatus = gameStatus;
		if (
			this.gameType === GameType.SPECIAL_INVITE ||
			this.gameType === GameType.SPECIAL_MATCHING
		) {
			this.ballSpeed = this.getRandomNumber(1, 3);
			this.racketSize = this.getRandomNumber(1, 3);
		} else {
			// Set to 1 for NORMAL
			this.ballSpeed = 1;
			this.racketSize = 1;
		}
	}

	private getRandomNumber(min: number, max: number): number {
		// Generate a random integer between min and max (inclusive)
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}
