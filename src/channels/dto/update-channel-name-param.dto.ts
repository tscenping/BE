export class UpdateChannelNameParamDto {
	channelId: number;
	userId: number;
	newName: string;

	constructor(channelId: number, userId: number, newName: string) {
		this.channelId = channelId;
		this.userId = userId;
		this.newName = newName;
	}
}
