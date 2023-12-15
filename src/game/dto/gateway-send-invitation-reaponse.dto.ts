export class GatewaySendInvitationReplyDto {
	targetUserId: number;
	targetUserChannelSocketId: string;
	isAccepted: boolean;
	gameId: number | null;
}
