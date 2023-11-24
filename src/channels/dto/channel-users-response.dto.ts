import { ChannelUserInfoReturnDto } from './channel-user-info-return.dto';
import { ChannelUserType } from '../../common/enum';

export type ChannelUsersResponseDto = {
	channelUsers: ChannelUserInfoReturnDto[];
	myChannelUserType: ChannelUserType;
};
