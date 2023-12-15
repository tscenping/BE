import { ChannelEventType } from 'src/common/enum';

export type ChannelNoticeResponseDto = {
	nickname: string;
	eventType: ChannelEventType;
};
