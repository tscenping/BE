export class EmitEventInvitationReplyDto {
	targetUserId: number;
	targetUserChannelSocketId: string;
	isAccepted: boolean;
	gameId: number | null;
}
