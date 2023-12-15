import { ApiProperty } from '@nestjs/swagger';
import { ChannelUserType } from 'src/common/enum';

export class ChannelInvitationListDto {
    @ApiProperty({ description: '채널유저id' })
    channelUserId: number;
    @ApiProperty({ description: '유저id' })
    userId : number;
    @ApiProperty({ description: '유저닉네임' })
    nickname : string;
    @ApiProperty({ description: '유저아바타' })
    avatar : string;
    @ApiProperty({ description: '친구여부' })
    isFriend : boolean;
    @ApiProperty({ description: '차단여부' })
    isBlocked : boolean;
    @ApiProperty({ description: '채널유저타입' })
    channelUserType : ChannelUserType;
}