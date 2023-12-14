export class GatewaySendInvitationReplyDto {
	targetUserChannelSocketId: string;
	isAccepted: boolean;
	gameId: number | null;
}
