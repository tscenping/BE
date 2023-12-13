import { IsIn, IsString } from 'class-validator';
import { GameType } from '../../common/enum';

export class GatewayCreateGameInvitationParamDto {
	invitationId: number;

	invitingUserNickname: string;

	invitedUserChannelSocketId: string;

	@IsIn([GameType.NORMAL_INVITE, GameType.SPECIAL_INVITE])
	@IsString()
	gameType: GameType;
}
