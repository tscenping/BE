import { GameStatus, GameType } from '../../common/enum';

export class UpdateGameResultParamDto {
	winnerId: number;
	loserId: number;
	winnerScore: number;
	loserScore: number;
	gameType: GameType;
	gameStatus: GameStatus;
}
