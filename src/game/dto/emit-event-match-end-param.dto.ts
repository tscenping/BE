import { GameType } from '../../common/enum';

export class EmitEventMatchEndParamDto {
	gameType: GameType;
	rivalScore: number | null;
	myScore: number | null;
	isWin: boolean | null;
	myLadderScore: number | null;
	rivalLadderScore: number | null;
}
