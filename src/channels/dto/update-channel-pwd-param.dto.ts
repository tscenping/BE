export class UpdateChannelPwdParamDto {
	channelId: number;
	userId: number;
	password: string | null;

	constructor(channelId: number, userId: number, password: string | null) {
		this.channelId = channelId;
		this.userId = userId;
		this.password = password;
	}
}
