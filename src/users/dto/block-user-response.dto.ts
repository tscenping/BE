import { FriendInfoDto } from './friend-info.dto';

export type BlockUserResponseDto = {
	friends: FriendInfoDto[];

	totalItemCount: number;
};
