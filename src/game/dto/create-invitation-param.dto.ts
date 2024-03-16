import { GameType } from '../../common/enum';
import { IsIn, IsInt, IsPositive, IsString } from 'class-validator';
import { User } from '../../user-repository/entities/user.entity';

export class CreateGameInvitationParamDto {
	invitingUser: User;

	@IsInt()
	@IsPositive()
	invitedUserId: number;

	@IsIn([GameType.NORMAL_INVITE, GameType.SPECIAL_INVITE])
	@IsString()
	gameType: GameType;
}
