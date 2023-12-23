import { GameStatus } from '../../common/enum';

export class UpdateGameResultParamDto {
	winnerId: number;
	loserId: number;
	winnerScore: number;
	loserScore: number;
	gameStatus: GameStatus;
}
