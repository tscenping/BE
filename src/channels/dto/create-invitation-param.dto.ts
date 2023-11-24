export class CreateInvitationParamDto {
	invitingUserId: number;
	channelId: number;
	invitedUserId: number;

	constructor(
		invitingUserId: number,
		channelId: number,
		invitedUserId: number,
	) {
		this.invitingUserId = invitingUserId;
		this.channelId = channelId;
		this.invitedUserId = invitedUserId;
	}
}
