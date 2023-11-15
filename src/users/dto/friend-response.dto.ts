import { FriendInfoDto } from './friend-info.dto';

export type FriendResponseDto = {
	friends: FriendInfoDto[];

	totalItemCount: number;
};
