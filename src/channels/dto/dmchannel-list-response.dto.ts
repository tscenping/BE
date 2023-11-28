import { DmChannelListReturnDto } from './dmchannel-list-return.dto';

export type DmChannelListResponseDto = {
    dmChannels: DmChannelListReturnDto[];

    totalItemCount: number;
};
