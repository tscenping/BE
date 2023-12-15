import { ChannelEventType } from 'src/common/enum';

export type ChannelNoticeResponseDto = {
	channelId: number;
	nickname: string;
	eventType: ChannelEventType;
};
