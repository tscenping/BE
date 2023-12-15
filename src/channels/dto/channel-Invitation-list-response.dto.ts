import { ChannelInvitationListDto } from "./channel-Invitation-list-return.dto";

export type ChannelInvitationListResponseDto = {
    channelId : number;
    channelName : string;
    channelUsers: ChannelInvitationListDto[];
};