import { ChannelUserType } from 'src/common/enum';

export type ChannelUserInfoReturnDto = {
	channelUserId: number;
	userId: number;
	nickname: string;
	avatar: string;
	isFriend: boolean;
	isBlocked: boolean;
	channelUserType: ChannelUserType;
};
