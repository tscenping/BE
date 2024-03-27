import { ChannelEventType } from 'src/common/enum';

export type ChannelNameChangeResponseDto = {
	channelId: number;
	newName: string;
	eventType: ChannelEventType;
};
