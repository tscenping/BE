import { ChannelUserType } from 'src/common/enum';
import { ChannelUserInfoReturnDto } from './channel-user-info-return.dto';

export type CreateChannelResponseDto = {
	channelId: number;
	channelUsers: ChannelUserInfoReturnDto[];
	myChannelUserType: ChannelUserType;
};
