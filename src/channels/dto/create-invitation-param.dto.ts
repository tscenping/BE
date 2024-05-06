import { User } from '../../user-repository/entities/user.entity';

export class CreateInvitationParamDto {
	invitingUser: User;
	channelId: number;
	invitedUserId: number;

	constructor(invitingUser: User, channelId: number, invitedUserId: number) {
		this.invitingUser = invitingUser;
		this.channelId = channelId;
		this.invitedUserId = invitedUserId;
	}
}
