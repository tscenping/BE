import { ChannelListReturnDto } from "./channel-list-return.dto";

export type ChannelListResponseDto = {
    channels: ChannelListReturnDto[];
    
    totalDataSize: number;
};