import { GameType } from '../../common/enum';
import { IsIn } from 'class-validator';

export class GameInvitationRequestDto {
	invitedUserId: number;

	// @IsIn([GameType.NORMAL_INVITE, GameType.SPECIAL_INVITE])
	gameType: GameType;
}
