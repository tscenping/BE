import { IsIn, IsString } from 'class-validator';
import { GameType } from '../../common/enum';

export class GatewayCreateInvitationParamDto {
	invitationId: number;

	invitingUserNickname: string;

	invitedUserId: number;

	@IsIn([GameType.NORMAL_INVITE, GameType.SPECIAL_INVITE])
	@IsString()
	gameType: GameType;
}
